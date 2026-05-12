const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const StockMovement = require('../models/StockMovement');

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];

const roundMoney = (value = 0) => Math.round((Number(value) || 0) * 100) / 100;

/**
 * Genere les mois a afficher selon le nombre de jours selectionnés
 */
const getMonthSeries = (days) => {
  const now = new Date();
  const months = [];
  // On calcule combien de mois on doit reculer (min 1 mois pour 7j/30j)
  const monthsToCover = days <= 30 ? 1 : Math.ceil(days / 30);

  for (let i = monthsToCover - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;

    months.push({
      key,
      year,
      month,
      label: MONTH_LABELS[month - 1],
    });
  }
  return months;
};

const monthKeyExpression = (dateField = '$date') => ({
  $concat: [
    { $toString: { $year: dateField } },
    '-',
    {
      $cond: [
        { $lt: [{ $month: dateField }, 10] },
        { $concat: ['0', { $toString: { $month: dateField } }] },
        { $toString: { $month: dateField } },
      ],
    },
  ],
});

const isEntryExpression = {
  $regexMatch: { input: { $ifNull: ['$type', ''] }, regex: /^entr/i },
};

/**
 * Build Dashboard Logic
 */
const buildStockDashboard = async (period = 30) => {
  const days = parseInt(period) || 30;
  const months = getMonthSeries(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const activeProductMatch = { isActive: { $ne: false }, archived: { $ne: true } };
  
  // Filtre dynamique pour la période sélectionnée
  const periodMatch = { date: { $gte: startDate } };
  const productPeriodMatch = { createdAt: { $gte: startDate } }; // Pour les nouveaux produits

  const [
    totalProducts,      
    produitsEnStock,
    produitsEnRupture,
    lowStock,
    nombreCategories,
    totalFournisseurs,
    movementTotals,
    stockValue,
    monthlyMovements,
    topProducts,
    categories,
    topFournisseurs,
  ] = await Promise.all([
    // 1. KPI: Total produits actifs (GLOBAL)
    Product.countDocuments(activeProductMatch), 
    
    // 2. KPI: Produits en stock (GLOBAL)
    Product.countDocuments({ ...activeProductMatch, stock: { $gt: 0 } }),
    
    // 3. KPI: Produits en rupture (GLOBAL)
    Product.countDocuments({ ...activeProductMatch, stock: { $lte: 0 } }),

    // 4. KPI: Stock faible (GLOBAL)
    Product.countDocuments({
      ...activeProductMatch,
      $expr: { $lte: ['$stock', { $ifNull: ['$minStock', 10] }] },
      stock: { $gt: 0 }
    }),

    // 5. Categories (GLOBAL)
    Category.countDocuments(),
    
    // 6. Fournisseurs actifs (GLOBAL)
    Supplier.countDocuments({ status: { $ne: 'inactif' } }),
    
    // 7. Totaux des mouvements (ENTREES / SORTIES) - Dynamique
    StockMovement.aggregate([
      { $match: periodMatch },
      {
        $group: {
          _id: null,
          totalMouvements: { $sum: 1 },
          entreeMouvements: { $sum: { $cond: [isEntryExpression, 1, 0] } },
          sortieMouvements: { $sum: { $cond: [isEntryExpression, 0, 1] } },
          totalEntrees: { $sum: { $cond: [isEntryExpression, '$quantity', 0] } },
          totalSorties: { $sum: { $cond: [isEntryExpression, 0, '$quantity'] } },
        },
      },
    ]),

    // 8. Valeur de stock (GLOBAL - tous produits actifs)
    Product.aggregate([
      { $match: activeProductMatch },
      {
        $group: {
          _id: null,
          value: { $sum: { $multiply: ['$stock', '$price'] } },
        },
      },
    ]),

    // 9. Flux mensuel (Chart)
    StockMovement.aggregate([
      { $match: periodMatch },
      {
        $group: {
          _id: {
            month: monthKeyExpression('$date'),
            isEntry: isEntryExpression,
          },
          quantity: { $sum: '$quantity' },
          count: { $sum: 1 },
        },
      },
    ]),

    // 10. TOP Produits (Mouvements de la période)
    StockMovement.aggregate([
      { $match: periodMatch },
      { $group: { _id: '$productId', totalQty: { $sum: '$quantity' } } },
      { $sort: { totalQty: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { name: '$product.name', stock: '$product.stock', value: { $multiply: ['$product.stock', '$product.price'] } } }
    ]),

    // 11. Categories actives
    StockMovement.aggregate([
        { $match: periodMatch },
        { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $group: { _id: '$product.category', count: { $sum: 1 }, totalStock: { $sum: '$product.stock' }, totalValue: { $sum: { $multiply: ['$product.stock', '$product.price'] } } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, name: { $ifNull: ['$_id', 'Sans categorie'] }, count: 1, totalStock: 1, totalValue: 1 } }
    ]),

    // 12. Top Fournisseurs
    StockMovement.aggregate([
        { $match: periodMatch },
        { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $group: { _id: '$product.supplierId', total: { $sum: { $multiply: ['$product.stock', '$product.price'] } }, commandes: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
        { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, nom: { $ifNull: ['$supplier.name', 'Fournisseur'] }, total: 1, commandes: 1 } }
    ])
  ]);
  const movement = movementTotals[0] || {};
  const movementMap = new Map();
  monthlyMovements.forEach((row) => {
    movementMap.set(`${row._id.month}-${row._id.isEntry ? 'entry' : 'exit'}`, row.quantity || 0);
  });

  const monthly = months.map((month) => ({
    label: month.label,
    key: month.key,
    entree: movementMap.get(`${month.key}-entry`) || 0,
    sortie: movementMap.get(`${month.key}-exit`) || 0,
  }));

  const kpi = {
    totalProducts,
    produitsEnStock,
    produitsEnRupture,
    nombreCategories,
    totalMouvements: movement.totalMouvements || 0,
    entreeMouvements: movement.entreeMouvements || 0,
    sortieMouvements: movement.sortieMouvements || 0,
    totalEntrees: movement.totalEntrees || 0,
    totalSorties: movement.totalSorties || 0,
    totalFournisseurs,
    lowStock,
    stockValue: roundMoney(stockValue[0]?.value || 0),
  };

  return {
    kpi,
    monthlyMovements: monthly,
    topProducts: topProducts.map((item) => ({
      name: item.name,
      stock: item.stock || 0,
      value: roundMoney(item.value || 0),
    })),
    categories: categories.map((item) => ({
      ...item,
      totalValue: roundMoney(item.totalValue || 0),
    })),
    topFournisseurs: topFournisseurs.map((item, index) => ({
      id: item.id || index,
      nom: item.nom,
      total: roundMoney(item.total || 0),
      commandes: item.commandes || 0,
      produits: (item.produits || []).map((product) => ({
        nom: product.nom,
        achat: roundMoney(product.achat || 0),
      })),
    })),
  };
};

/**
 * Route Handler
 */
const getStockKpi = async (req, res) => {
  try {
    // On récupère la période depuis les query params (?period=7)
    const { period } = req.query; 
    
    // On construit le dashboard en passant la période
    const dashboard = await buildStockDashboard(period);
    const { kpi } = dashboard;

    res.json({
      success: true,
      ...kpi,
      totalProducts: kpi.totalProducts,
      totalCategories: kpi.nombreCategories,
      totalSuppliers: kpi.totalFournisseurs,
      data: dashboard,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStockKpi,
};
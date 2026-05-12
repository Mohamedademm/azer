const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Supplier = require('../src/models/Supplier');
const StockMovement = require('../src/models/StockMovement');

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

const CATEGORIES = [
  { name: 'Électronique', code: 'ELEC', description: 'Composants et appareils électroniques' },
  { name: 'Informatique', code: 'INFO', description: 'Ordinateurs, périphériques et accessoires' },
  { name: 'Bureautique', code: 'BURE', description: 'Imprimantes, scanners et consommables' },
  { name: 'Mobilier', code: 'MOBI', description: 'Meubles de bureau et rangement' },
  { name: 'Fournitures', code: 'FOUR', description: 'Fournitures de bureau et papeterie' },
  { name: 'Réseau', code: 'RESE', description: 'Équipements réseau et télécommunication' },
  { name: 'Sécurité', code: 'SECU', description: 'Systèmes de sécurité et surveillance' },
  { name: 'Éclairage', code: 'ECLA', description: 'Lampes, LED et solutions éclairage' },
  { name: 'Outillage', code: 'OUTI', description: 'Outils et équipements techniques' },
  { name: 'Emballage', code: 'EMBA', description: 'Cartons, films et solutions emballage' },
];

const SUPPLIERS = [
  { name: 'TechnoPlus SARL', code: 'SUP-TP01', contact: 'Ahmed Ben Salah', email: 'contact@technoplus.tn', phone: '+216 71 234 567', address: 'Zone Industrielle Charguia 1, Tunis', rating: 5 },
  { name: 'MedDistrib', code: 'SUP-MD02', contact: 'Sami Khelifi', email: 'info@meddistrib.tn', phone: '+216 73 456 789', address: 'Avenue Habib Bourguiba, Sousse', rating: 4 },
  { name: 'GlobalStock TN', code: 'SUP-GS03', contact: 'Leila Mansouri', email: 'commandes@globalstock.tn', phone: '+216 74 567 890', address: 'Rue de la Liberté, Sfax', rating: 5 },
  { name: 'ProBureau', code: 'SUP-PB04', contact: 'Karim Bouzidi', email: 'ventes@probureau.tn', phone: '+216 71 345 678', address: 'Centre Urbain Nord, Tunis', rating: 4 },
  { name: 'NetCom Solutions', code: 'SUP-NC05', contact: 'Ines Trabelsi', email: 'sales@netcom.tn', phone: '+216 71 678 901', address: 'Technopole El Ghazala, Ariana', rating: 3 },
  { name: 'SecurVision', code: 'SUP-SV06', contact: 'Mohamed Jebali', email: 'info@securvision.tn', phone: '+216 72 789 012', address: 'Zone Industrielle, Bizerte', rating: 4 },
  { name: 'LumiTech', code: 'SUP-LT07', contact: 'Fatma Chahed', email: 'contact@lumitech.tn', phone: '+216 75 890 123', address: 'Avenue de la République, Monastir', rating: 5 },
  { name: 'PackExpress', code: 'SUP-PE08', contact: 'Youssef Hammami', email: 'orders@packexpress.tn', phone: '+216 76 901 234', address: 'Zone Franche, Zarzis', rating: 3 },
];

// Products by category: [name, price, minStock]
const PRODUCTS_BY_CAT = {
  'Électronique': [
    ['Câble HDMI 2.1 Premium 2m', 25, 20], ['Adaptateur USB-C vers HDMI', 35, 15], ['Chargeur rapide 65W USB-C', 45, 25],
    ['Batterie externe 20000mAh', 89, 10], ['Hub USB-C 7 ports', 65, 12], ['Câble Ethernet Cat6 5m', 15, 30],
    ['Multiprise parafoudre 6 prises', 42, 20], ['Convertisseur HDMI-VGA', 28, 15], ['Station de charge sans fil', 55, 10],
    ['Câble DisplayPort 1.4 3m', 32, 15], ['Adaptateur jack 3.5mm USB-C', 18, 25], ['Rallonge USB 3.0 5m', 22, 20],
    ['Splitter HDMI 1x4', 48, 8], ['Câble optique audio 2m', 20, 15], ['Bloc alimentation universel', 38, 12],
  ],
  'Informatique': [
    ['Clavier mécanique RGB Cherry MX', 129, 8], ['Souris gaming sans fil 16000 DPI', 79, 10], ['Écran LED 27 pouces 4K', 899, 3],
    ['SSD NVMe 1To Samsung', 189, 5], ['RAM DDR5 32Go 5600MHz', 245, 5], ['Webcam Full HD 1080p', 65, 12],
    ['Casque Bluetooth ANC', 149, 8], ['Tapis de souris XXL 90x40', 35, 15], ['Support écran réglable', 89, 6],
    ['Disque dur externe 4To', 159, 5], ['Clé USB 128Go USB 3.2', 28, 20], ['Ventilateur PC 120mm RGB', 18, 25],
    ['Pâte thermique 4g', 12, 30], ['Boîtier PC ATX Mesh', 95, 4], ['Carte graphique GTX 1660', 349, 3],
  ],
  'Bureautique': [
    ['Toner HP LaserJet noir', 89, 10], ['Cartouche encre Canon couleur', 45, 15], ['Papier A4 80g 500 feuilles', 8, 50],
    ['Papier A3 90g 250 feuilles', 15, 20], ['Rouleau étiquettes thermiques', 12, 25], ['Ruban imprimante matricielle', 18, 15],
    ['Kit tambour Brother DR-2400', 95, 5], ['Têtes impression HP 950XL', 55, 10], ['Papier photo A4 glossy 50f', 22, 15],
    ['Enveloppes C5 blanc x500', 25, 20], ['Classeur levier A4 dos 80mm', 6, 40], ['Chemise cartonnée A4 x100', 18, 25],
    ['Intercalaires 12 positions', 5, 30], ['Pochettes plastifiées A4 x100', 15, 20], ['Reliure spirale plastique x50', 12, 15],
  ],
  'Mobilier': [
    ['Bureau droit 160x80 chêne', 450, 2], ['Chaise ergonomique Pro', 589, 3], ['Armoire métallique 2 portes', 380, 2],
    ['Caisson mobile 3 tiroirs', 195, 4], ['Table réunion 240x120', 750, 1], ['Étagère métallique 5 niveaux', 165, 3],
    ['Fauteuil direction cuir', 890, 2], ['Cloison acoustique 160cm', 320, 3], ['Support clavier coulissant', 45, 8],
    ['Repose-pieds ergonomique', 55, 10], ['Lampe bureau LED articulée', 65, 8], ['Poubelle tri sélectif 60L', 85, 5],
    ['Porte-manteau mural 6 crochets', 35, 10], ['Tableau blanc magnétique 120x90', 95, 4], ['Destructeur documents P-4', 189, 3],
  ],
  'Fournitures': [
    ['Stylo bille BIC bleu x50', 12, 30], ['Marqueur permanent noir x12', 18, 20], ['Surligneur fluo x6', 8, 25],
    ['Bloc-notes A5 ligné x10', 15, 20], ['Post-it 76x76mm x12 blocs', 22, 15], ['Agrafeuse métal 25 feuilles', 15, 12],
    ['Agrafes 26/6 x5000', 5, 30], ['Perforatrice 2 trous 30f', 18, 10], ['Ciseaux inox 21cm', 8, 15],
    ['Colle bâton 40g x10', 12, 20], ['Correcteur liquide x6', 10, 15], ['Trombones 32mm x1000', 4, 30],
    ['Élastiques assortis 100g', 3, 25], ['Ruban adhésif 19mm x33m x6', 8, 20], ['Règle aluminium 30cm', 5, 20],
  ],
  'Réseau': [
    ['Switch manageable 24 ports Gigabit', 485, 3], ['Point accès WiFi 6 AX3600', 289, 4], ['Routeur VPN entreprise', 395, 3],
    ['Patch panel 24 ports Cat6', 85, 5], ['Rack serveur 42U', 1250, 1], ['Onduleur rack 3000VA', 890, 2],
    ['Câble fibre optique LC-LC 10m', 35, 10], ['Convertisseur fibre SFP+', 125, 5], ['Testeur câble réseau RJ45', 65, 6],
    ['Prise murale RJ45 Cat6', 12, 30], ['Goulotte PVC 60x40 2m', 8, 25], ['Baie de brassage 12U murale', 320, 2],
    ['Injecteur PoE Gigabit', 45, 10], ['Antenne WiFi directionnelle', 75, 5], ['NAS 4 baies Synology', 650, 2],
  ],
  'Sécurité': [
    ['Caméra IP dôme 4MP PoE', 195, 5], ['Caméra bullet extérieur 8MP', 285, 4], ['NVR 16 canaux 4K', 650, 2],
    ['Disque dur surveillance 4To', 145, 5], ['Détecteur mouvement infrarouge', 35, 10], ['Contrôle accès biométrique', 485, 3],
    ['Serrure électronique RFID', 195, 5], ['Badge proximité RFID x100', 85, 8], ['Centrale alarme 32 zones', 520, 2],
    ['Sirène extérieure flash', 65, 8], ['Détecteur fumée optique', 28, 15], ['Extincteur CO2 5kg', 95, 5],
    ['Coffre-fort électronique 40L', 350, 2], ['Miroir convexe sécurité 60cm', 55, 5], ['Barrière infrarouge 100m', 185, 3],
  ],
  'Éclairage': [
    ['Panneau LED 60x60 40W 4000K', 45, 10], ['Dalle LED encastrable 30x30', 28, 15], ['Réglette LED 120cm 36W', 22, 15],
    ['Spot LED encastrable 12W', 15, 20], ['Projecteur LED 100W extérieur', 85, 5], ['Ampoule LED E27 12W x10', 25, 20],
    ['Tube LED T8 150cm 24W', 18, 15], ['Applique murale LED 18W', 35, 10], ['Suspension LED design 30W', 95, 5],
    ['Détecteur crépusculaire', 22, 10], ['Hublot LED étanche 18W', 28, 12], ['Ruban LED RGB 5m + télécommande', 32, 10],
    ['Lampadaire LED sur pied 40W', 125, 4], ['Éclairage secours LED 3h', 45, 8], ['Minuterie escalier programmable', 35, 10],
  ],
  'Outillage': [
    ['Perceuse-visseuse 18V Li-ion', 165, 4], ['Jeu tournevis précision x25', 28, 10], ['Pince coupante isolée 1000V', 35, 8],
    ['Multimètre numérique pro', 85, 5], ['Fer à souder station 60W', 95, 4], ['Kit embouts vissage x100', 22, 12],
    ['Niveau laser croix vert', 145, 3], ['Mètre ruban 8m magnétique', 15, 10], ['Scie sauteuse 700W', 125, 3],
    ['Meuleuse angulaire 125mm', 95, 4], ['Pistolet à colle 80W', 25, 8], ['Lampe frontale LED 300lm', 22, 10],
    ['Gants travail anti-coupure x12', 35, 15], ['Lunettes protection anti-buée', 12, 20], ['Caisse à outils complète 135pcs', 195, 3],
  ],
  'Emballage': [
    ['Carton déménagement 60x40x40', 3, 50], ['Film étirable palette 500mm', 12, 20], ['Papier bulle 100cm x50m', 35, 8],
    ['Ruban adhésif emballage 50mm x6', 10, 25], ['Enveloppe matelassée x50', 22, 15], ['Sac plastique 30x40 x1000', 18, 20],
    ['Papier kraft rouleau 1m x50m', 28, 8], ['Mousse protection 2mm rouleau', 25, 10], ['Coin carton protection x200', 15, 15],
    ['Feuillard polypropylène 15mm', 32, 8], ['Tendeur élastique x20', 18, 12], ['Palette bois 120x80 EUR', 18, 10],
    ['Housse palette 130x80x180', 8, 15], ['Étiquette expédition x500', 12, 20], ['Pistolet cerclage manuel', 145, 3],
  ],
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(monthsAgo) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════════════════════════════════════════════════════════════
// MAIN SEED
// ═══════════════════════════════════════════════════════════════

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/azer';
  console.log('Connexion à MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connecté!\n');

  // 1. Categories
  console.log('📂 Création des catégories...');
  const categoryDocs = {};
  for (const cat of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { name: cat.name },
      { $setOnInsert: cat },
      { upsert: true, new: true }
    );
    categoryDocs[cat.name] = doc;
  }
  console.log(`   → ${CATEGORIES.length} catégories\n`);

  // 2. Suppliers
  console.log('🏭 Création des fournisseurs...');
  const supplierDocs = [];
  for (const sup of SUPPLIERS) {
    const doc = await Supplier.findOneAndUpdate(
      { email: sup.email },
      { $setOnInsert: { ...sup, status: 'actif', since: randomDate(randomInt(6, 18)) } },
      { upsert: true, new: true }
    );
    supplierDocs.push(doc);
  }
  console.log(`   → ${SUPPLIERS.length} fournisseurs\n`);

  // 3. Products + Movements
  console.log('📦 Création des 150 produits + mouvements...');
  let totalProducts = 0;
  let totalMovements = 0;
  const catNames = Object.keys(PRODUCTS_BY_CAT);
  const REASONS_ENTRY = ['purchase', 'return', 'adjustment', 'initial'];
  const REASONS_EXIT = ['sale', 'damage', 'adjustment'];

  for (const catName of catNames) {
    const products = PRODUCTS_BY_CAT[catName];
    const category = categoryDocs[catName];
    
    for (let i = 0; i < products.length; i++) {
      const [name, basePrice, minStock] = products[i];
      const supplier = pickRandom(supplierDocs);
      const monthsAgo = randomInt(1, 12);
      const createdAt = randomDate(monthsAgo);
      const price = Math.round(basePrice * (0.85 + Math.random() * 0.3) * 100) / 100;

      // Determine stock scenario
      const roll = Math.random();
      let targetStock;
      if (roll < 0.15) targetStock = 0;            // 15% rupture
      else if (roll < 0.40) targetStock = randomInt(1, minStock); // 25% stock faible
      else targetStock = randomInt(minStock + 1, minStock * 10);  // 60% normal

      const sku = `${category.code}-${String(i + 1).padStart(3, '0')}`;

      // Check if product already exists
      const existing = await Product.findOne({ name });
      if (existing) continue;

      const product = new Product({
        name, category: catName, stock: targetStock, price,
        supplierId: supplier._id, minStock, sku, isActive: true,
        description: `${name} - Catégorie ${catName}`,
      });
      product.createdAt = createdAt;
      product.updatedAt = new Date(createdAt.getTime() + randomInt(1, 60) * 86400000);
      await product.save();
      totalProducts++;

      // Generate stock movements for this product
      const numMovements = randomInt(3, 10);
      let runningStock = 0;

      for (let m = 0; m < numMovements; m++) {
        const movMonthsAgo = Math.max(0, monthsAgo - m);
        const movDate = randomDate(Math.max(0, movMonthsAgo));
        
        // Ensure first movement is always an entry
        let type, quantity, reason;
        if (m === 0 || runningStock < 5) {
          type = 'entrée';
          quantity = randomInt(10, 100);
          reason = pickRandom(REASONS_ENTRY);
        } else if (Math.random() < 0.45) {
          type = 'sortie';
          quantity = Math.min(randomInt(1, 30), runningStock);
          reason = pickRandom(REASONS_EXIT);
          if (quantity === 0) continue;
        } else {
          type = 'entrée';
          quantity = randomInt(5, 50);
          reason = pickRandom(REASONS_ENTRY);
        }

        if (type === 'entrée') runningStock += quantity;
        else runningStock -= quantity;

        // Use collection.insertOne to bypass pre-save middleware (stock validation)
        await StockMovement.collection.insertOne({
          productId: product._id,
          product: name,
          date: movDate,
          type, quantity, reason,
          user: 'seed-script',
          note: 'Mouvement auto-généré (seed)',
          createdAt: movDate,
          updatedAt: movDate,
        });
        totalMovements++;
      }
    }
  }

  // 4. Update category product counts
  console.log('\n📊 Mise à jour des compteurs...');
  for (const catName of catNames) {
    const count = await Product.countDocuments({ category: catName, isActive: true });
    await Category.findOneAndUpdate({ name: catName }, { productCount: count });
  }
  for (const sup of supplierDocs) {
    const count = await Product.countDocuments({ supplierId: sup._id, isActive: true });
    await Supplier.findByIdAndUpdate(sup._id, { products: count });
  }

  console.log('\n══════════════════════════════════════');
  console.log('  ✅ SEED TERMINÉ AVEC SUCCÈS');
  console.log('══════════════════════════════════════');
  console.log(`  📦 Produits créés    : ${totalProducts}`);
  console.log(`  📂 Catégories        : ${CATEGORIES.length}`);
  console.log(`  🏭 Fournisseurs      : ${SUPPLIERS.length}`);
  console.log(`  📈 Mouvements stock  : ${totalMovements}`);
  console.log('══════════════════════════════════════\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});

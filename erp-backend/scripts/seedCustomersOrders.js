const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Customer = require('../src/models/Customer');
const Order = require('../src/models/Order');
const Invoice = require('../src/models/Invoice');
const Product = require('../src/models/Product');
const User = require('../src/models/User');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const CUSTOMERS = [
  { firstName: 'Alice', lastName: 'Dupont', email: 'alice.dupont@example.com', phone: '0612345678', address: { street: '1 Rue de Paris', city: 'Paris', postalCode: '75001' } },
  { firstName: 'Bob', lastName: 'Martin', email: 'bob.martin@example.com', phone: '0623456789', address: { street: '2 Avenue des Champs', city: 'Lyon', postalCode: '69002' } },
  { firstName: 'Charlie', lastName: 'Durand', email: 'charlie.durand@example.com', phone: '0634567890', address: { street: '3 Boulevard Jean Jaurès', city: 'Marseille', postalCode: '13008' } },
  { firstName: 'David', lastName: 'Leroy', email: 'david.leroy@example.com', phone: '0645678901', address: { street: '4 Rue Victor Hugo', city: 'Toulouse', postalCode: '31000' } },
  { firstName: 'Emma', lastName: 'Moreau', email: 'emma.moreau@example.com', phone: '0656789012', address: { street: '5 Place de la Gare', city: 'Bordeaux', postalCode: '33000' } },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/azer';
  console.log('Connexion à MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connecté!\n');

  const adminUser = await User.findOne({ role: 'admin_principal' });
  if (!adminUser) {
    console.error('❌ Aucun admin trouvé. Lancez npm run seed:users d\'abord.');
    process.exit(1);
  }

  // 1. Customers
  console.log('👥 Création des clients...');
  const customerDocs = [];
  for (const c of CUSTOMERS) {
    const doc = await Customer.findOneAndUpdate(
      { email: c.email },
      { $setOnInsert: { ...c, createdBy: adminUser._id } },
      { upsert: true, returnDocument: 'after' }
    );
    customerDocs.push(doc);
  }
  console.log(`   → ${customerDocs.length} clients\n`);

  // 2. Orders and Invoices
  console.log('🛒 Création des commandes et factures...');
  const products = await Product.find().limit(20);
  if (products.length === 0) {
    console.error('❌ Aucun produit trouvé. Lancez le seed des produits d\'abord.');
    process.exit(1);
  }

  let orderCount = 0;
  let invoiceCount = 0;

  for (const customer of customerDocs) {
    const numOrders = randomInt(2, 5);
    for (let i = 0; i < numOrders; i++) {
      const selectedProduct = pickRandom(products);
      const qty = randomInt(1, 10);
      const items = [{
        product: selectedProduct._id,
        quantity: qty,
        unitPrice: selectedProduct.price
      }];

      const count = await Order.countDocuments();
      const orderNumber = `CMD-202605-${String(count + 1).padStart(5, '0')}`;
      
      const order = new Order({
        orderNumber,
        type: 'vente',
        customer: customer._id,
        date: new Date(),
        items,
        status: pickRandom(['validée', 'payée', 'livrée']),
        paymentStatus: pickRandom(['en_attente', 'payée']),
        createdBy: adminUser._id
      });
      await order.save();
      orderCount++;

      // Create invoice for this order
      const invoice = new Invoice({
        type: 'facture',
        customer: customer._id,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
        items: [{
          product: selectedProduct._id,
          description: selectedProduct.name,
          quantity: qty,
          unitPrice: selectedProduct.price,
          taxRate: 20
        }],
        status: order.paymentStatus === 'payée' ? 'payée' : 'validée',
        orderId: order.orderNumber,
        createdBy: adminUser._id
      });
      
      if (invoice.status === 'payée') {
        invoice.amountPaid = invoice.totalTTC || (qty * selectedProduct.price * 1.2);
        invoice.paymentMethod = 'carte';
        invoice.paidAt = new Date();
      }

      await invoice.save();
      invoiceCount++;
    }
  }

  console.log(`   → ${orderCount} commandes`);
  console.log(`   → ${invoiceCount} factures\n`);

  console.log('✅ SEED TERMINÉ AVEC SUCCÈS');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});

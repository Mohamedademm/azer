const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csvtojson');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const modelsDir = path.join(__dirname, '../src/models');
fs.readdirSync(modelsDir).forEach(file => {
  if (file.endsWith('.js')) {
    require(path.join(modelsDir, file));
  }
});

const fileToModelMap = {
  'azer.accounts.csv': 'Account',
  'azer.archives.csv': 'Archive',
  'azer.auditlogs.csv': 'AuditLog',
  'azer.categories.csv': 'Category',
  'azer.customers.csv': 'Customer',
  'azer.depenses.csv': 'Depense',
  'azer.depensesettings.csv': 'DepenseSettings',
  'azer.invoices.csv': 'Invoice',
  'azer.notifications.csv': 'Notification',
  'azer.payments.csv': 'Payment',
  'azer.products.csv': 'Product',
  'azer.reports.csv': 'Report',
  'azer.transactions.csv': 'Transaction'
};

const processNestedArrays = (jsonObj) => {
  const result = { ...jsonObj };
  // Handle keys like entries[0].account
  Object.keys(result).forEach(key => {
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]\.(.+)$/);
    if (arrayMatch) {
      const [, arrayName, indexStr, propName] = arrayMatch;
      const index = parseInt(indexStr, 10);
      
      if (!result[arrayName]) {
        result[arrayName] = [];
      }
      if (!result[arrayName][index]) {
        result[arrayName][index] = {};
      }
      
      // Handle nested parsing (if there's further nesting, though not expected here)
      let value = result[key];
      if (value === "") value = undefined; // empty strings as undefined for ObjectId or Numbers
      else if (!isNaN(value) && value.trim() !== '') value = Number(value);
      
      result[arrayName][index][propName] = value;
      delete result[key];
    } else {
      // Normal keys
      let value = result[key];
      if (value === "") result[key] = undefined;
      else if (value === "true") result[key] = true;
      else if (value === "false") result[key] = false;
      // Note: we leave string numbers alone unless specifically needed, to avoid breaking phone numbers etc.
    }
  });

  // Filter out empty array items (e.g. if entries[1] has all undefined props)
  Object.keys(result).forEach(key => {
    if (Array.isArray(result[key])) {
      result[key] = result[key].filter(item => {
        if (!item) return false;
        return Object.values(item).some(v => v !== undefined && v !== '');
      });
    }
  });

  return result;
};

async function seedDatabase() {
  console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // We disable strict mode validation errors during import for nested structures that might be slightly off
    mongoose.set('strict', false);

    const baseDir = path.join(__dirname, '../');

    for (const [filename, modelName] of Object.entries(fileToModelMap)) {
      const filePath = path.join(baseDir, filename);
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filename}, skipping...`);
        continue;
      }

      console.log(`\nImporting ${filename} -> ${modelName} model...`);
      const Model = mongoose.models[modelName];
      if (!Model) {
        console.error(`Model ${modelName} not found! Registered models:`, mongoose.modelNames());
        continue;
      }

      const jsonArray = await csv().fromFile(filePath);
      console.log(`Parsed ${jsonArray.length} records from ${filename}. Processing...`);

      const operations = jsonArray.map(rawRecord => {
        const processed = processNestedArrays(rawRecord);
        
        // Remove empty strings to prevent cast errors on ObjectIds
        Object.keys(processed).forEach(k => {
          if (processed[k] === undefined || processed[k] === '') {
            delete processed[k];
          }
        });

        // Use _id to upsert
        return {
          updateOne: {
            filter: { _id: processed._id },
            update: { $set: processed },
            upsert: true
          }
        };
      });

      if (operations.length > 0) {
        try {
          const result = await Model.bulkWrite(operations, { ordered: false });
          console.log(`✅ Success for ${modelName}: Inserted ${result.upsertedCount}, Updated ${result.modifiedCount}`);
        } catch (error) {
          console.error(`❌ Error importing ${modelName}:`, error.message);
          // Sometimes bulkWrite throws error but still inserts valid docs.
        }
      } else {
        console.log(`No valid records found for ${modelName}.`);
      }
    }

    console.log('\nImport process finished.');
  } catch (err) {
    console.error('Fatal error during import:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedDatabase();

const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  item: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0.01
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate(value) {
      if (!Number.isInteger(value)) throw new Error('Quantity must be an integer!');
    }
  },
  total_price: {
    type: Number,
    required: false
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
});

// Count total price by multiplying price and quantity
purchaseSchema.pre('save', function (next) {
  this.total_price = this.price * this.quantity;
  this.total_price = Math.round(this.total_price * 100) / 100;
  next();
});

// Change the format it returns
purchaseSchema.methods.toJSON = function () {
  const purchase = this;
  const purchaseObject = purchase.toObject();

  purchaseObject.date = convertDate(purchaseObject.date);
  delete purchaseObject.__v;

  return purchaseObject;
};

// Get from Date type as String type, e.g.
function convertDate(d) {
  d = d.toString();
  var parts = d.split(' ');
  var months = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
    Jul: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12'
  };
  return parts[3] + '-' + months[parts[1]] + '-' + parts[2];
}

const Purchase = new mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;

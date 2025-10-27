const SellerProfile = require('../models/SellerProfile');
const asyncHandler = require('../middleware/async');

const buildDefaultProfile = (user) => ({
  storeName: user?.name || '',
  tagline: '',
  supportEmail: user?.email || '',
  supportPhone: user?.phone || '',
  website: '',
  city: user?.address?.city || '',
  addressLine: '',
  about: '',
  fulfillmentTime: '2-3 business days',
  returnPolicy: 'Returns accepted within 14 days if items remain unopened.',
  pickupAvailable: false,
  featuredCategories: '',
  instagram: '',
  facebook: '',
  tiktok: ''
});

const formatProfile = (profileDoc, user) => {
  if (!profileDoc) {
    return buildDefaultProfile(user);
  }

  const profileObj = profileDoc.toObject ? profileDoc.toObject() : profileDoc;
  const { user: _user, __v, createdAt, updatedAt, ...rest } = profileObj;
  return {
    ...buildDefaultProfile(user),
    ...rest
  };
};

const sanitizePayload = (payload = {}) => {
  const allowed = [
    'storeName',
    'tagline',
    'supportEmail',
    'supportPhone',
    'website',
    'city',
    'addressLine',
    'about',
    'fulfillmentTime',
    'returnPolicy',
    'pickupAvailable',
    'featuredCategories',
    'instagram',
    'facebook',
    'tiktok'
  ];

  return allowed.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      acc[key] = payload[key];
    }
    return acc;
  }, {});
};

exports.getSellerProfile = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });

  res.status(200).json({
    success: true,
    data: formatProfile(profile, req.user)
  });
});

exports.updateSellerProfile = asyncHandler(async (req, res) => {
  const updates = sanitizePayload(req.body);

  const profile = await SellerProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: { ...updates, user: req.user._id } },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  res.status(200).json({
    success: true,
    data: formatProfile(profile, req.user)
  });
});

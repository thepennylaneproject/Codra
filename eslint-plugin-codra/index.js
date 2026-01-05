const noArbitraryTailwind = require('./rules/no-arbitrary-tailwind');
const coralRestricted = require('./rules/coral-restricted');
const fontSizeLocked = require('./rules/font-size-locked');
const fontWeightLocked = require('./rules/font-weight-locked');
const spacingLocked = require('./rules/spacing-locked');
const buttonUsage = require('./rules/button-usage');

module.exports = {
  rules: {
    'no-arbitrary-tailwind': noArbitraryTailwind,
    'coral-restricted': coralRestricted,
    'font-size-locked': fontSizeLocked,
    'font-weight-locked': fontWeightLocked,
    'spacing-locked': spacingLocked,
    'button-usage': buttonUsage,
  },
};

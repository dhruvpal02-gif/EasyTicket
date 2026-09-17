const fs = require('fs');
let code = fs.readFileSync('server/controllers/authController.js', 'utf8');

const bankReplacement = export const updateBankDetails = async (req, res) => {
  try {
    const { accountName, bankName, accountNumber, ifscCode } = req.body;
    
    if (!accountName && !bankName && !accountNumber && !ifscCode) {
      return res.status(400).json({ message: 'Please provide bank details to update.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.bankDetails = {
      accountName: accountName || user.bankDetails?.accountName,
      bankName: bankName || user.bankDetails?.bankName,
      accountNumber: accountNumber || user.bankDetails?.accountNumber,
      ifscCode: ifscCode || user.bankDetails?.ifscCode,
    };

    const updatedUser = await user.save();

    return res.status(200).json({
      message: 'Bank details updated successfully.',
      user: safeUser(updatedUser)
    });
  } catch (error) {
    console.error('updateBankDetails error:', error.message);
    return res.status(500).json({ message: 'Server error updating bank details.' });
  }
};

// -- PATCH /api/auth/profile ----------------------------------------------
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) user.name = name;
    if (req.file) {
      user.profilePicture = req.file.path;
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: safeUser(updatedUser)
    });
  } catch (error) {
    console.error('updateProfile error:', error.message);
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
};
;

const regex = /export const updateBankDetails = async \(req, res\) => \{[\s\S]*?Server error updating bank details.' \}\);\n  \}\n\};/m;
code = code.replace(regex, bankReplacement);

fs.writeFileSync('server/controllers/authController.js', code, 'utf8');

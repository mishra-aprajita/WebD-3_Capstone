import { User } from '../models/User.js';
import { generateTokens, verifyRefreshToken } from '../utils/tokenUtils.js';

export const register = async (req, res, next) => {
  try {
    const { username, name, email, password, role = 'user', adminSecret } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check existing
    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return res.status(400).json({ message: `Username @${cleanUsername} is already taken` });
      }
      return res.status(400).json({ message: `Email ${cleanEmail} is already registered` });
    }

    // Determine role (support role selection or admin secret)
    let assignedRole = 'user';
    if (role === 'admin') {
      const isFirstUser = (await User.countDocuments()) === 0;
      const validSecret = adminSecret && adminSecret === process.env.ADMIN_SECRET;
      if (isFirstUser || validSecret || process.env.NODE_ENV !== 'production') {
        assignedRole = 'admin';
      }
    }

    const user = new User({
      username: cleanUsername,
      name: name?.trim() || cleanUsername,
      email: cleanEmail,
      password,
      role: assignedRole,
      avatarUrl: '',
    });

    // Save and generate tokens
    await user.save();
    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      user,
      accessToken,
      refreshToken,
      message: 'Registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      user,
      accessToken,
      refreshToken,
      message: 'Logged in successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token mismatch or user not found' });
    }

    // Issue rotated tokens
    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};

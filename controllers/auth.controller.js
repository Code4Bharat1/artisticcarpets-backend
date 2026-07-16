import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;
        if (!name || !email || !password || !phoneNumber)
            return res.status(400).json({ message: "All fields required" });
        const existingAdmin = await AdminModel.findOne({ email });
        if (existingAdmin) return res.status(400).json({ message: "Admin exists" });
        const hashed = await bcrypt.hash(password, 10);
        const newAdmin = await AdminModel.create({ name, email, password: hashed, phoneNumber });
        const token = jwt.sign({ id: newAdmin._id, role: "admin" }, JWT_SECRET, {
            expiresIn: "7d",
        });
        return res.status(201).json({
            message: "Admin created",
            token,
            admin: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email },
        });
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};





export const loginAdmin = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password)
            return res.status(400).json({ message: "Email or phone number & password required" });
        const admin = await AdminModel.findOne({
            $or: [{ email: identifier }, { phoneNumber: identifier }],
        });
        if (!admin) return res.status(400).json({ message: "Invalid credentials" });
        const ok = await bcrypt.compare(password, admin.password);
        if (!ok) return res.status(400).json({ message: "Invalid credentials" });
        const token = jwt.sign({ id: admin._id, role: "admin" }, JWT_SECRET, {
            expiresIn: "7d",
        });
        return res.status(200).json({
            message: "Logged in",
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email, phoneNumber: admin.phoneNumber },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logoutAdmin = async (req, res) => {
    try {
        res.status(201).json({ message: 'Admin logout successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const registerUser = async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;
        if (!name || !email || !password || !phoneNumber)
            return res.status(400).json({ message: "All fields required" });
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User exists" });
        const hashed = await bcrypt.hash(password, 10);
        const newUser = await UserModel.create({ name, email, password: hashed, phoneNumber });
        const token = jwt.sign({ id: newUser._id, role: "user" }, JWT_SECRET, {
            expiresIn: "7d",
        });
        return res.status(201).json({
            message: "User created",
            token,
            admin: { id: newUser._id, name: newUser.name, email: newUser.email },
        });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const loginUser = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password)
            return res.status(400).json({ message: "Email or phone number & password required" });
        const user = await UserModel.findOne({
            $or: [{ email: identifier }, { phoneNumber: identifier }],
        });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ message: "Invalid credentials" });
        const token = jwt.sign({ id: user._id, role: "user" }, JWT_SECRET, {
            expiresIn: "7d",
        });
        return res.status(200).json({
            message: "Logged in",
            token,
            user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logoutUser = async (req, res) => {
    try {
        res.status(201).json({ message: 'User logout successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }
        const payload = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
        const newToken = jwt.sign({ id: payload.id, role: payload.role }, JWT_SECRET, { expiresIn: "7d" });
        return res.status(200).json({ token: newToken });
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const { id, role } = req.user;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Old password and new password are required" });
        }

        let Model = null;
        if (role === "admin") Model = Admin;
        else if (role === "user") Model = user;

        const user = await Model.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid old password" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        let user = await AdminModel.findOne({ email }) || await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        return res.status(200).json({ message: "Password reset link sent successfully", resetToken: "123456" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email and newPassword are required" });
        }

        let Model = null;
        let user = await AdminModel.findOne({ email });
        if (user) Model = Admin;

        if (!user) {
            user = await userModel.findOne({ email });
            if (user) Model = user;
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
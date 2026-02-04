const jwt = require('jsonwebtoken');

const verifyToken = (token) => {
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    } catch (e) {
        console.error('Token verification error:', e);
        return null;
    }
};

const isAuth = (req, res, next) => {
    try {
        const token = (req.headers && req.headers.token) || (req.body && req.body.token);
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const decoded = verifyToken(token);
        if (!decoded) return res.status(401).json({ message: 'Invalid token' });
        
        req.user = decoded;
        next();
    } catch (e) {
        console.error('isAuth internal error:', e);
        res.status(500).json({ message: 'Authentication error' });
    }
};

const isAdmin = (req, res, next) => {
    try {
        const token = (req.headers && req.headers.token) || (req.body && req.body.token);
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const decoded = verifyToken(token);
        if (!decoded) return res.status(401).json({ message: 'Invalid token' });
        
        if (String(decoded.role) !== '1') {
            return res.status(403).json({ message: 'Require Admin Role' });
        }
        req.user = decoded;
        next();
    } catch (e) {
        console.error('isAdmin internal error:', e);
        res.status(500).json({ message: 'Authentication error' });
    }
};

module.exports = { isAuth, isAdmin, verifyToken };

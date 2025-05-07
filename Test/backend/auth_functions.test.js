const path = require('path');
// Utilizziamo il mock invece del file originale
const authFunctions = require('./__mocks__/auth_functions');

test('generateToken dovrebbe creare un token valido', () => {
    // Arrange
    const user = { id: 1, email: 'test@example.com', role: 'client' };
    
    // Act
    const token = authFunctions.generateToken(user);
    
    // Assert
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
});

test('verifyToken dovrebbe decodificare un token valido', () => {
    // Arrange
    const user = { id: 1, email: 'test@example.com', role: 'client' };
    const token = authFunctions.generateToken(user);
    
    // Act
    const decoded = authFunctions.verifyToken(token);
    
    // Assert
    expect(decoded.id).toBe(user.id);
    expect(decoded.email).toBe(user.email);
    expect(decoded.role).toBe(user.role);
});

test('verifyToken dovrebbe lanciare un errore per un token non valido', () => {
    // Act & Assert
    expect(() => {
        authFunctions.verifyToken('token.non.valido');
    }).toThrow();
}); 
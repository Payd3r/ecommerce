// Mock per le chiamate API
const mockSuccessfulLogin = (email, password) => {
  return {
    success: true,
    data: {
      token: 'fake-jwt-token',
      user: {
        id: 1,
        name: 'Utente Test',
        email: email,
        role: 'client'
      }
    }
  };
};

const mockFailedLogin = () => {
  return {
    success: false,
    message: 'Credenziali non valide'
  };
};

const mockSuccessfulRegister = (name, email, role) => {
  return {
    success: true,
    data: {
      token: 'fake-jwt-token',
      user: {
        id: 2,
        name: name,
        email: email,
        role: role || 'client'
      }
    }
  };
};

const mockFailedRegister = () => {
  return {
    success: false,
    message: 'Email già registrata'
  };
};

const mockUserProfile = () => {
  return {
    success: true,
    data: {
      id: 1,
      name: 'Utente Test',
      email: 'test@example.com',
      role: 'client',
      profile_image_url: 'https://example.com/profile.jpg'
    }
  };
};

const mockProductsList = () => {
  return {
    success: true,
    data: {
      products: [
        {
          id: 1,
          name: 'Prodotto Test 1',
          description: 'Descrizione prodotto 1',
          price: 19.99,
          artisan_id: 1,
          category_id: 1,
          images: ['https://example.com/product1.jpg']
        },
        {
          id: 2,
          name: 'Prodotto Test 2',
          description: 'Descrizione prodotto 2',
          price: 29.99,
          artisan_id: 2,
          category_id: 2,
          images: ['https://example.com/product2.jpg']
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 2
      }
    }
  };
};

const mockCartData = () => {
  return {
    success: true,
    data: {
      id: 1,
      user_id: 1,
      items: [
        {
          id: 1,
          product_id: 1,
          quantity: 2,
          product: {
            id: 1,
            name: 'Prodotto Test 1',
            price: 19.99,
            images: ['https://example.com/product1.jpg']
          }
        }
      ],
      total: 39.98
    }
  };
};

const mockEmptyCart = () => {
  return {
    success: true,
    data: {
      id: null,
      user_id: 1,
      items: [],
      total: 0
    }
  };
};

const mockCategories = () => {
  return {
    success: true,
    data: [
      {
        id: 1,
        name: 'Categoria 1',
        parent_id: null,
        image_url: 'https://example.com/cat1.jpg',
        product_count: 10
      },
      {
        id: 2,
        name: 'Categoria 2',
        parent_id: 1,
        image_url: 'https://example.com/cat2.jpg',
        product_count: 5
      }
    ]
  };
};

module.exports = {
  mockSuccessfulLogin,
  mockFailedLogin,
  mockSuccessfulRegister,
  mockFailedRegister,
  mockUserProfile,
  mockProductsList,
  mockCartData,
  mockEmptyCart,
  mockCategories
}; 
// Test di esempio per verificare la configurazione

describe('Test Frontend di Base', () => {
  test('dovrebbe passare un test di esempio', () => {
    expect(true).toBe(true);
  });

  test('dovrebbe concatenare stringhe', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World');
  });
  
  test('dovrebbe eseguire semplici operazioni matematiche', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
    expect(20 / 5).toBe(4);
  });
  
  test('dovrebbe manipolare array', () => {
    const array = [1, 2, 3];
    expect(array.length).toBe(3);
    expect(array[0]).toBe(1);
    
    array.push(4);
    expect(array.length).toBe(4);
    expect(array[3]).toBe(4);
  });
  
  test('dovrebbe manipolare oggetti', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj.name).toBe('Test');
    expect(obj.value).toBe(42);
    
    obj.name = 'Nuovo Test';
    expect(obj.name).toBe('Nuovo Test');
  });
}); 
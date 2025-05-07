// Utility per simulare il DOM in ambiente di test

// Simula l'evento click su un elemento
function simulateClick(element) {
    const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    element.dispatchEvent(event);
}

// Simula l'invio di un form
function simulateSubmit(formElement) {
    const event = new Event('submit', {
        bubbles: true,
        cancelable: true
    });
    formElement.dispatchEvent(event);
}

// Simula l'inserimento di testo in un input
function simulateInput(inputElement, value) {
    // Imposta il valore
    inputElement.value = value;
    
    // Genera evento input
    const inputEvent = new Event('input', {
        bubbles: true,
        cancelable: true
    });
    inputElement.dispatchEvent(inputEvent);
    
    // Genera evento change
    const changeEvent = new Event('change', {
        bubbles: true,
        cancelable: true
    });
    inputElement.dispatchEvent(changeEvent);
}

// Aspetta un evento specifico
function waitForEvent(element, eventName, timeout = 2000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            element.removeEventListener(eventName, handler);
            reject(new Error(`Timeout attesa evento ${eventName}`));
        }, timeout);
        
        const handler = (event) => {
            element.removeEventListener(eventName, handler);
            clearTimeout(timer);
            resolve(event);
        };
        
        element.addEventListener(eventName, handler);
    });
}

// Funzione di attesa basata su condizione
function waitForCondition(conditionFn, timeout = 2000, interval = 100) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
            if (conditionFn()) {
                resolve();
            } else if (Date.now() - startTime >= timeout) {
                reject(new Error('Timeout attesa condizione'));
            } else {
                setTimeout(check, interval);
            }
        };
        
        check();
    });
}

module.exports = {
    simulateClick,
    simulateSubmit,
    simulateInput,
    waitForEvent,
    waitForCondition
}; 
class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

class CurrencyConverter {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currencies = [];
    }

    async getCurrencies() {
        const url = `${this.apiUrl}/currencies`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            this.currencies = Object.keys(data).map((code) => {
                return new Currency(code, data[code]);
            });
        } catch (error) {
            console.error('Error fetching currencies:', error);
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        const url = `${this.apiUrl}/latest?amount=${amount}&from=${fromCurrency.code}&to=${toCurrency.code}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.rates[toCurrency.code];
        } catch (error) {
            console.error('Error converting currency:', error);
            return null;
        }
    }

    async getExchangeRateOnDate(date, baseCurrency, targetCurrency) {
        const formattedDate = date.toISOString().split('T')[0]; // Convert date to YYYY-MM-DD format
        const url = `${this.apiUrl}/${formattedDate}?from=${baseCurrency.code}&to=${targetCurrency.code}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.rates[targetCurrency.code];
        } catch (error) {
            console.error(`Error fetching exchange rate for ${formattedDate}:`, error);
            return null;
        }
    }

    async getExchangeRateToday(baseCurrency, targetCurrency) {
        const today = new Date();
        return this.getExchangeRateOnDate(today, baseCurrency, targetCurrency);
    }

    async getExchangeRateYesterday(baseCurrency, targetCurrency) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return this.getExchangeRateOnDate(yesterday, baseCurrency, targetCurrency);
    }

    async getExchangeRateDifference(baseCurrency, targetCurrency) {
        const rateToday = await this.getExchangeRateToday(baseCurrency, targetCurrency);
        const rateYesterday = await this.getExchangeRateYesterday(baseCurrency, targetCurrency);

        if (rateToday !== null && rateYesterday !== null) {
            return rateToday - rateYesterday;
        } else {
            return null;
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("conversion-form");
    const resultDiv = document.getElementById("result");
    const fromCurrencySelect = document.getElementById("from-currency");
    const toCurrencySelect = document.getElementById("to-currency");

    const converter = new CurrencyConverter("https://api.frankfurter.app");

    await converter.getCurrencies();
    populateCurrencies(fromCurrencySelect, converter.currencies);
    populateCurrencies(toCurrencySelect, converter.currencies);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const fromCurrency = converter.currencies.find(
            (currency) => currency.code === fromCurrencySelect.value
        );
        const toCurrency = converter.currencies.find(
            (currency) => currency.code === toCurrencySelect.value
        );

        const convertedAmount = await converter.convertCurrency(
            amount,
            fromCurrency,
            toCurrency
        );

        if (convertedAmount !== null && !isNaN(convertedAmount)) {
            resultDiv.textContent = `${amount} ${
                fromCurrency.code
            } son ${convertedAmount.toFixed(2)} ${toCurrency.code}`;
        } else {
            resultDiv.textContent = "Error al realizar la conversión.";
        }

        const difference = await converter.getExchangeRateDifference(fromCurrency, toCurrency);
        if (difference !== null) {
            resultDiv.textContent += `\nLa diferencia entre las tasas de cambio entre las monedas con respecto a hoy y ayer es de: ${difference.toFixed(6)}`;
        } else {
            resultDiv.textContent += "\nError al obtener la diferencia entre tasas de cambio.";
        }
    });

    function populateCurrencies(selectElement, currencies) {
        if (currencies) {
            currencies.forEach((currency) => {
                const option = document.createElement("option");
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                selectElement.appendChild(option);
            });
        }
    }
});

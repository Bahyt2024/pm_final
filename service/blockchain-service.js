class BlockchainService {
    constructor() {
        // В памяти храним транзакции
        this.transactions = [];
    }

    // Симуляция создания транзакции
    async createTransaction(transactionData) {
        const transaction = {
            id: transactionData.transactionId,
            blockchainHash: `0x${Math.random().toString(36).substr(2, 64)}`, // Сгенерированный хеш
            blockchainStatus: 'pending',
            blockchainFee: transactionData.blockchainFee || 0.01, // Допустим, комиссия фиксированная
            timestamp: new Date(),
        };

        // Добавляем транзакцию в "блокчейн"
        this.transactions.push(transaction);
        return transaction;
    }

    // Симуляция получения всех транзакций
    async getAllTransactions() {
        return this.transactions;
    }

    // Симуляция получения транзакции по ID
    async getTransactionById(transactionId) {
        return this.transactions.find(tx => tx.id === transactionId);
    }

    // Симуляция обновления статуса транзакции
    async updateTransactionStatus(transactionId, status) {
        const transaction = this.transactions.find(tx => tx.id === transactionId);
        if (transaction) {
            transaction.blockchainStatus = status;
            return transaction;
        } else {
            throw new Error('Transaction not found');
        }
    }

    // Симуляция удаления транзакции
    async deleteTransaction(transactionId) {
        const index = this.transactions.findIndex(tx => tx.id === transactionId);
        if (index !== -1) {
            const deletedTransaction = this.transactions.splice(index, 1);
            return deletedTransaction;
        } else {
            throw new Error('Transaction not found');
        }
    }
}

module.exports = new BlockchainService();

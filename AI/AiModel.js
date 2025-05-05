const LogisticRegression = require('ml-logistic-regression');
const { Matrix }         = require('ml-matrix');
const TransactionModel   = require('../models/transaction-model');
const AccountModel       = require('../models/account-model');

let trainedModel = null;
let _trained     = false;

module.exports = {
    /**
     * Обучение модели
     */
    trainModel: async () => {
        try {
            const users        = await AccountModel.find();
            const transactions = await TransactionModel.find();

            const features = [];
            const labels   = [];

            users.forEach(user => {
                if (!user._id || !user.creditStatus) return;
                const userTx = transactions.filter(t =>
                    String(t.userId) === String(user._id) && t.status === 'completed'
                );
                features.push([ userTx.length, user.balance || 0 ]);
                labels.push(user.creditStatus === 'approved' ? 1 : 0);
            });

            if (!features.length) {
                console.warn('Нет данных для обучения, пропускаем');
                _trained = true;
                return;
            }

            const X = new Matrix(features);
            const Y = Matrix.columnVector(labels);

            const logreg = new LogisticRegression({ numSteps: 2000, learningRate: 0.005 });
            logreg.train(X, Y);

            // Accuracy
            const predictions = logreg.predict(X);
            const yTrue = Y.to1DArray();

            let correct = 0;
            for (let i = 0; i < yTrue.length; i++) {
                if (predictions[i] === yTrue[i]) correct++;
            }

            const accuracy = (correct / yTrue.length) * 100;
            console.log(`ML-модель обучена на ${features.length} примерах`);
            console.log(`Accuracy: ${accuracy.toFixed(2)}%`);

            trainedModel = logreg;
            _trained     = true;
        } catch (err) {
            console.error('Ошибка при обучении модели:', err);
        }
    }
    ,

    /** Проверка, обучена ли модель */
    isTrained: () => _trained,

    /**
     * Предсказание (0 или 1)
     */
    predict: (successfulTransactions, averageBalance) => {
        if (!trainedModel) {
            throw new Error('Модель ещё не обучена');
        }
        const input        = new Matrix([[successfulTransactions, averageBalance]]);
        const [prediction] = trainedModel.predict(input);
        return prediction;
    }
};

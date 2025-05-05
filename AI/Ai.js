let trainedModel = null;

module.exports = {
    setModel: (model) => {
        trainedModel = model;
    },
    predict: (features) => {
        if (!trainedModel) {
            throw new Error('Модель ещё не обучена');
        }
        return trainedModel.predict(features)[0]; // возвращаем 0 или 1
    }
};

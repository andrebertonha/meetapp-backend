

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'meetups',
      'canceled_at', {
      type: Sequelize.DATE,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('meetups', 'canceled_at');
  },
};

const { expect } = require('chai');
const moment = require('moment');

const AlreadyRedeemedError = require('../../src/models/AlreadyRedeemedError');
const User = require('../../src/models/User');

describe('daily', async () => {
  describe('when user never claimed a daily before', async () => {
    let user;

    beforeEach(async () => {
      user = await User.query().insert({ displayName: 'user' });
    });

    it('allows user to claim', async () => {
      const { sols, bonus } = await user.daily();
      expect(sols).to.be.above(0);
      expect(sols).to.be.below(7);
      expect(bonus).to.be.above(-1);
      expect(bonus).to.be.below(4);
    });

    it('sets the last daily field', async () => {
      const { sols, bonus } = await user.daily();
      const newUser = await User.query().where('display_name', 'user').first();
      expect(newUser.lastDailyAt).to.not.be.undefined;
    });
  });

  describe('when user has claimed in less than 22 hours ago', async () => {
    let user, nextSlot;

    beforeEach(async () => {
      const lastDailyAt = moment().subtract(21, 'hours');
      nextSlot = moment(lastDailyAt).add(22, 'hours');
      user = await User.query().insert({ displayName: 'user', lastDailyAt });
    });

    it('raises an error with the next slot', async () => {
      try {
        await user.daily();
        expect.fail('No expection thrown');
      } catch (err) {
        if (err instanceof AlreadyRedeemedError) {
          expect(err.nextSlot).to.eql(nextSlot);
          return;
        }
        throw err;
      }
    });
  });

  describe('when user claimed in more than 22 hours ago', async () => {
    let user;

    beforeEach(async () => {
      const lastDailyAt = moment().subtract(23, 'hours');
      user = await User.query().insert({ displayName: 'user', lastDailyAt });
    });

    it('allows user to claim', async () => {
      const { sols, bonus } = await user.daily();
      expect(sols).to.be.above(0);
      expect(sols).to.be.below(6);
      expect(bonus).to.be.above(-1);
      expect(bonus).to.be.below(5);
    });
  });
});

describe('find', async () => {
  describe('with the twitch handle', async () => {
    it('returns the user', async () => {
      await User.query().insert({ displayName: 'user' });
      const user = await User.find('user');
      expect(user).to.exist;
      expect(user.displayName).to.eql('user');
    });
  });

  describe('with the discord mention', async () => {
    it('returns the user', async () => {
      await User.query().insert({ displayName: 'user', discordId: '312260311144595457' });
      const user = await User.find('<@!312260311144595457>');
      expect(user).to.exist;
      expect(user.displayName).to.eql('user');
    });
  });
});

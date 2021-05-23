const { expect } = require('chai');
const moment = require('moment');

const FakeInterface = require('../FakeInterface');
const iface = new FakeInterface();

const daily = require('../../../src/commands/discord/Daily');
const User = require('../../../src/models/User');

describe('Daily', async () => {
  describe('when user never claimed a daily before', async () => {
    let user;

    beforeEach(async () => {
      user = await User.query().insert({ displayName: 'user' });
      await daily(iface, {
        channel: 'channel',
        user: 'user',
        message: 'daily',
      });
    });

    it('allows user to claim', async () => {
      expect(iface.lastMessage).to.contain('você recebeu :sun_with_face:');
    });
  });

  describe('when user has claimed in less than 24 hours ago', async () => {
    let user, nextSlot;

    beforeEach(async () => {
      const lastDailyAt = moment().subtract(23, 'hours');
      nextSlot = moment(lastDailyAt).add(24, 'hours');
      user = await User.query().insert({ displayName: 'user', lastDailyAt });
      await daily(iface, {
        channel: 'channel',
        user: 'user',
        message: 'daily',
      });
    });

    it('tells the user when he/she can claim again', async () => {
      expect(iface.lastMessage).to.contain('você já pegou seu daily hoje. Você pode pegar de novo em uma hora.');
    });
  });

  describe('when user claimed in more than 24 hours ago', async () => {
    let user;

    beforeEach(async () => {
      const lastDailyAt = moment().subtract(25, 'hours');
      user = await User.query().insert({ displayName: 'user', lastDailyAt });
      await daily(iface, {
        channel: 'channel',
        user: 'user',
        message: 'daily',
      });
    });

    it('allows user to claim', async () => {
      expect(iface.lastMessage).to.contain('você recebeu :sun_with_face:');
    });
  });
});

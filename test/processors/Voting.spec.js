const { expect } = require('chai');

const FakeMessage = require('../discord/Message');
const { findOrCreateReaction, addReaction } = require('../discord/Reaction');
const VotingProcessor = require('../../src/processors/Voting');
const Voting = require('../../src/processors/Voting');
const { Discord, Channel } = require('../discord');

describe('Voting', async () => {
  describe('configuration', async () => {
    it('sets channels', async () => {
      expect(new Voting('a,b').channels).to.eql(['a', 'b']);
    });

    it('sets channels from environment', async () => {
      process.env.VOTING_CHANNELS = 'x,z';
      expect(new Voting().channels).to.eql(['x', 'z']);
    });

    it('sets exception roles', async () => {
      process.env.VOTING_ALLOW_ROLES = 'mod,others';
      expect(new Voting('a,b').allowedRoles).to.eql(['mod', 'others']);
    });
  });

  describe('adding reactions', async () => {
    let msg, voting;

    beforeEach(async () => {
      msg = new FakeMessage('I am the best', { channelName: 'channel', authorID: 'userid' });
      voting = new VotingProcessor('channel');
      await voting.handle(msg);
    });

    it('adds a reaction to each post', async () => {
      expect(msg._reactions.map(r => r.emoji.name)).to.eql([Voting.UPVOTE, Voting.DOWNVOTE]);
    });

    describe('when user had already voted in another option', async () => {
      it('removes the other vote', async () => {
        const user = {
          id: 'userid',
          username: 'username',
        };

        const upReaction = addReaction(msg, Voting.UPVOTE, user);
        const downReaction = addReaction(msg, Voting.DOWNVOTE, user);

        await voting.handleReaction(upReaction, user);
        expect(upReaction.count).to.eql(2);

        await voting.handleReaction(downReaction, user);
        expect(msg.reactions.cache.get(Voting.UPVOTE).count).to.eql(1);
      });
    });
  });

  describe('removing previous votes', async () => {
    describe('when voted on the same cycle', async () => {
      let msg1, msg2, voting;

      beforeEach(async () => {
        const channel = new Channel('channel');
        msg1 = await channel.send('Picture 1', { authorID: 'poster1' });
        msg2 = await channel.send('Picture 2', { authorID: 'poster2' });
        voting = new VotingProcessor('channel');
        await voting.handle(msg1);
        await voting.handle(msg2);
      });

      it('removes vote 1 when vote 2 is casted', async () => {
        const user = {
          id: 'voterid',
          username: 'voter',
        };

        const vote1 = addReaction(msg1, Voting.UPVOTE, user);
        await voting.handleReaction(vote1, user);
        expect(msg1.reactions.cache.get(Voting.UPVOTE).count).to.eql(2);

        const vote2 = addReaction(msg2, Voting.UPVOTE, user);
        await voting.handleReaction(vote2, user);
        expect(msg2.reactions.cache.get(Voting.UPVOTE).count).to.eql(2);
        expect(msg1.reactions.cache.get(Voting.UPVOTE).count).to.eql(1);
      });
    });
  });
});

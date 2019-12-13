import { Op } from 'sequelize';
import { startofDay } from 'date-fns';
import User from '../models/User';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import File from '../models/File';

import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
  async index(req, res) {
    const meetups = await Subscription.findAll({
      where: { user_id: req.userId },
      attributes: ['id'],
      include: [
        {
          model: Meetup,
          as: 'meetup',
          required: true,
          attributes: ['id', 'title', 'location', 'date', 'past'],
          include: [
            {
              model: User,
              as: 'organizer',
              attributes: ['name', 'email'],
            },
            {
              model: File,
              as: 'banner',
              attributes: ['id', 'name', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const { meetupId: meetup_id } = req.params;
    const { userId: user_id } = req;

    const meetup = await Meetup.findByPk(meetup_id);

    if (meetup.user_id === user_id) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to you own meetups" });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't subscribe to past meetups" });
    }

    const checkIfIsSubscribed = await Subscription.findOne({
      where: { user_id, meetup_id },
    });

    if (checkIfIsSubscribed) {
      return res
        .status(400)
        .json({ error: 'You are already subscribed to this meetup.' });
    }

    /*
      verificar se usuario ja esta cadastrado em outro meetup na mesma data..

    const checkDate = await Subscription.findOne({
      where: {
        user_id,
      },
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to two meetups at the same time" });
    } */

    const subscription = await Subscription.create({
      user_id,
      meetup_id,
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
    });

    return res.json(subscription);
  }

  async delete(req, res) {
    const { id: meetup_id } = req.params;
    const { userId: user_id } = req;

    const meetup = await Meetup.findByPk(meetup_id);

    if (meetup.past) {
      return res.status(400).json({ error: 'This meetup has been passed' });
    }

    const subscription = await Subscription.findOne({
      where: { user_id, meetup_id },
    });

    if (!subscription) {
      return res
        .status(400)
        .json({ error: 'You are not subcribed in this meetup' });
    }

    await subscription.destroy();
    return res.send();
  }
}

export default new SubscriptionController();

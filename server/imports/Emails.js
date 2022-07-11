import {Lobbies, Events} from '../../imports/collections';
import {getUserEmail} from './ServerHelpers';
import {displayName} from '../../imports/helpers';
import { Email } from 'meteor/email';

export function SendReminderEmails() {
    //get all events that are starting in the next 15 minutes
    const time = moment().add(16, 'm').toDate();
    const events = Events.find({
        date: {$lte: time},
        notificationsSent: {$ne: true}
    });
    if (events.count() === 0) {
        return;
    }
    events.forEach((event) => {
        if (event.users && event.users.length > 0) {
            const eventName = event.name,
            eventDescription = event.description,
            lobbyName = Lobbies.findOne(event.lobbyId).displayName,
            link = FlowRouter.url('room', {lobbyId: event.lobbyId});

            var sendEmails = [];
            var html = '';
            Meteor.users.find({_id: {$in: event.users}}).forEach((user) => {
                const userEmail = getUserEmail(user);
                if (userEmail) {
                    sendEmails.push(userEmail);
                    html = `${eventName} ${eventDescription} ${lobbyName}. <a href="${link}>Profile link</a>`;
                }
            });
            const subject = "Acromania event starting soon";
            const from = "support@acromania.com";
            Email.send({ sendEmails, from, subject, html });
        }

        Events.update(event._id, {$set: {notificationsSent: true}});
    });
}

export function SendInviteEmail(user, lobby, inviterId) {
    const userEmail = getUserEmail(user),
        lobbyName = lobby.displayName,
        inviterUsername = displayName(inviterId),
        link = FlowRouter.url('room', {lobbyId: lobby._id});
    const html = `The ${inviterUsername} invited you to play! Join the ${lobbyName} now. <a href="${link}">Join ${lobbyName}</a>`;
    const subject = "You've been invited to play Acromania";
    const from = "support@acromania.com";
    const to = userEmail;
    Email.send({ to, from, subject, html });
}

export function SendShadowBannedNotification(bannedUserId, moderatorUserId, reason, banned) {
    const html = `The user ${displayName(bannedUserId)} (${bannedUserId}) has been ${banned ? 'BANNED' : 'UNBANNED'} by ${displayName(moderatorUserId)} (${moderatorUserId}) for the following reason: ${reason}`;
    const subject = `User has been ${banned ? 'BANNED' : 'UNBANNED'}`;
    const from = "support@acromania.com";
    var sendEmails = [];
    for (let i = 0; i < Meteor.settings.adminNotificationEmails.length; i++) {
        sendEmails.push(Meteor.settings.adminNotificationEmails[i]);
    }
    Email.send({ sendEmails, from, subject, html });
}

export function SendBlacklistedEmailNotification(emailAddr, userId) {
    const subject = `New signup with email ${emailAddr}`;
    const from = "support@acromania.com";
    const text = `A user signed up with email address: ${emailAddr}. Profile link: https://acromania.com/profile/${userId}`;
    const html = `A user signed up with email address: ${emailAddr}. <a href="https://acromania.com/profile/${userId}">Profile link</a>`;
    var sendEmails = [];
    for (let i = 0; i < Meteor.settings.adminNotificationEmails.length; i++) {
        sendEmails.push(Meteor.settings.adminNotificationEmails[i]);
    }
    Email.send({ sendEmails, from, subject, text });
}
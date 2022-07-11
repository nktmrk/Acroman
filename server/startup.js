import prerenderio from "prerender-node";
import timesyncServer from "timesync/server";

import GameManager from "./imports/GameManager";
import LobbyManager from "./imports/LobbyManager";

import { Games, Lobbies, Categories } from "../imports/collections";
import { defaultCategories } from "../imports/statics";

Meteor.startup(function() {
  //Prerender initialisation
  const prerenderSettings = Meteor.settings.prerenderio;
  if (prerenderSettings && prerenderSettings.token && prerenderSettings.host) {
    prerenderio.set("prerenderToken", prerenderSettings.token);
    prerenderio.set("host", prerenderSettings.host);
    prerenderio.set("protocol", "https");
    WebApp.rawConnectHandlers.use(prerenderio);
  }

  _.each(DefaultLobbies, lobby => {
    Lobbies.upsert({ name: lobby.name }, { $setOnInsert: lobby });

    const insertedLobby = Lobbies.findOne({ name: lobby.name });

    if (!insertedLobby.currentGame) {
      //insert first game
      const gameId = Games.insert({
        type: "acromania",
        lobbyId: insertedLobby._id,
        active: false,
        currentPhase: "category",
        currentRound: 0,
        endTime: null
      });
      Lobbies.update(insertedLobby._id, {
        $set: { currentGame: gameId },
        $push: { games: gameId }
      });
    } else {
      //game may be in progress, we should end it so timeouts will work properly
      const game = Games.findOne(insertedLobby.currentGame, {fields: {active: true}});
      const active = game && game.active;
      if (active) {
        Lobbies.update(insertedLobby._id, {$set: {players: []}});
        LobbyManager.addSystemMessage(insertedLobby._id, "Sorry, the current game was cancelled because of a server restart.", "warning", "");
        GameManager.makeGameInactive(insertedLobby.currentGame);
      }
    }
  });

  // Insert all default categories if they don't exist
  const currentDate = new Date();
  _.each(defaultCategories, category => {
    Categories.upsert(
      {
        category
      },
      {
        $setOnInsert: {
          category,
          custom: false,
          active: true,
          createdAt: currentDate
        }
      }
    );
  });
});

WebApp.connectHandlers.use("/timesync", timesyncServer.requestHandler);

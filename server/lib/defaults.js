AcroSettingsDefaults = {
  beginner: {
    acronymTimeout: 120000,
    votingTimeout: 45000,
    endOfRoundTimeout: 20000,
    inactiveTimeout: 20000,
    faceOffAcroTimeout: 30000,
    faceOffVoteTimeout: 20000,
    faceOffEndRoundTimeout: 8000,
    winnerPoints: 2,
    votedPoints: 1,
    votedForWinnerPoints: 1,
    notVotedNegativePoints: 1,
    minAcroLength: 3,
    maxAcroLength: 7,
    endGamePoints: 30
  },
  expert: {
    acronymTimeout: 60000,
    votingTimeout: 30000,
    endOfRoundTimeout: 20000,
    inactiveTimeout: 20000,
    faceOffAcroTimeout: 20000,
    faceOffVoteTimeout: 15000,
    faceOffEndRoundTimeout: 8000,
    winnerPoints: 2,
    votedPoints: 1,
    votedForWinnerPoints: 1,
    notVotedNegativePoints: 1,
    minAcroLength: 3,
    maxAcroLength: 7,
    endGamePoints: 30
  },
  small: {
    acronymTimeout: 120000,
    votingTimeout: 45000,
    endOfRoundTimeout: 20000,
    inactiveTimeout: 20000,
    faceOffAcroTimeout: 30000,
    faceOffVoteTimeout: 20000,
    faceOffEndRoundTimeout: 8000,
    winnerPoints: 2,
    votedPoints: 1,
    votedForWinnerPoints: 1,
    notVotedNegativePoints: 1,
    minAcroLength: 3,
    maxAcroLength: 7,
    endGamePoints: 15
  },
};

DefaultLobbies = [
  {
    name: "acro_general",
    displayName: "General",
    type: "acromania",
    players: [],
    config: AcroSettingsDefaults.beginner,
    games: [],
    currentGame: null,
    official: true
  },
  {
    name: "acro_beginner",
    displayName: "Clean",
    type: "acromania",
    players: [],
    config: AcroSettingsDefaults.beginner,
    games: [],
    currentGame: null,
    official: true
  },  
  {
    name: "acro_expert",
    displayName: "Experts",
    type: "acromania",
    players: [],
    config: AcroSettingsDefaults.expert,
    currentGame: null,
    official: true
  },
  {
    name: "acro_adult",
    displayName: "Adults Only!",
    type: "acromania",
    players: [],
    config: AcroSettingsDefaults.expert,
    currentGame: null,
    official: true
  },
  {
    name: "acro_small",
    displayName: "Small Games",
    type: "acromania",
    players: [],
    config: AcroSettingsDefaults.small,
    currentGame: null,
    official: true
  },
];
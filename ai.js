var _ = require("lodash");
var fs = require("fs");
var brain = require("brain");

var scoring = {
    red: function(num) {
        return num;
    },

    green: function(num) {
        return Math.floor(num / 2) * 4;
    },
    
    purple: function(num) {
        return Math.floor(Math.pow(num, 1.65));
    }
};

var colors = Object.keys(scoring);
var net = new brain.NeuralNetwork();

var scoreHand = function(hand) {
    var score = 0;

    colors.forEach(function(color) {
        score += scoring[color](hand[color]);
    });

    return score;
};

var addCardsToHand = function(hand, num) {
    for (var i = 0; i < num; i++) {
        // TODO: Adjust random-ness to pull from a real deck of cards
        // TODO: Take into account card passing and accessibility?
        var color = colors[Math.floor(Math.random() * colors.length)];
        //console.log("adding card", color)
        hand[color] += 1;
    }
};

var addCardsToHands = function(hands, num) {
    colors.forEach(function(handColor) {
        addCardsToHand(hands[handColor], num);
    });
};

var buildHandArray = function(handData, totalCards) {
    var inputHand = [];

    colors.forEach(function(color) {
        for (var n = 0; n < totalCards; n++) {
            inputHand.push(n < handData[color] ? 1 : 0);
        }
    });

    return inputHand;
};

var initHand = function() {
    var hand = {};
    colors.forEach(function(color) {
        hand[color] = 0;
    });
    return hand;
};

var playCard = function(hand, color) {
    hand[color] += 1;
};

var clone = function(hand) {
    var newHand = {};
    colors.forEach(function(color) {
        newHand[color] = hand[color];
    });
    return newHand;
};

var buildHands = function(hand, colorPos, handSize, callback) {
    for (var i = 0; i <= handSize; i++) {
        var curHand = _.clone(hand);
        curHand[colors[colorPos]] = i;

        if (colorPos === colors.length - 1) {
            if (handSize - i === 0) {
                callback(curHand);
            }
        } else {
            buildHands(curHand, colorPos + 1, handSize - i, callback);
        }
    }
};

var iterations = 5000;
var totalCards = 7;
var numStartingHands = 10;
var numPlaythroughs = 1000;

var trainData = [];

var startingCards = 6;
for (var startingCards = 1; startingCards < totalCards; startingCards++) {
    buildHands(initHand(), 0, startingCards, function(hand) {
        console.log("hand", hand);

        var colorHands = {};
        var inputHands = {};
        var wins = {};

        colors.forEach(function(color) {
            var handData = colorHands[color] = _.clone(hand);
            playCard(colorHands[color], color);

            inputHands[color] = buildHandArray(handData, totalCards);
            wins[color] = 0;
        });

        // TODO: Need to re-think this logic. Need to measure the effectiveness
        // of having played this card vs. other cards and the likelihood of
        // eventually winning, as a result.
        for (var i = 0; i < numPlaythroughs; i++) {
            var playthrough = _.clone(colorHands);
            if (hand.red === 0 && hand.green === 6 && hand.purple === 0) {
                //console.log("num cards", totalCards - startingCards);
            }
            addCardsToHands(playthrough, totalCards - startingCards - 1);

            var maxScore = 0;
            var scores = {};

            colors.forEach(function(color) {
                scores[color] = scoreHand(playthrough[color]);
                maxScore = Math.max(maxScore, scores[color]);
            });

            colors.forEach(function(color) {
                if (scores[color] >= maxScore) {
                    wins[color] += 1;
                }
            });
        }
        
        colors.forEach(function(color) {
            if (hand.red === 0 && hand.green === 6 && hand.purple === 0) {
                //console.log("inputHand", inputHands[color], wins[color] / numPlaythroughs)
                //process.exit(0)
            }
            
            trainData.push({
                input: inputHands[color],
                output: [wins[color] / numPlaythroughs]
            });
        });
        
        if (hand.red === 0 && hand.green === 6 && hand.purple === 0) {
            //console.log("inputHand", inputHands[color], wins[color] / numPlaythroughs)
            //process.exit(0)
        }
    });
}

//console.log(trainData)
console.log("Amount of training data:", trainData.length)

//process.exit(0);

console.log(net.train(trainData, {
    iterations: 500,
    log: true,
    logPeriod: 50
}));

for (var startingCards = 1; startingCards < totalCards; startingCards++) {
    buildHands(initHand(), 0, startingCards, function(hand) {
        console.log(
            startingCards,
            JSON.stringify(hand),
            net.run(buildHandArray(hand, totalCards))
        );
    });
}

fs.writeFileSync("ai.json", JSON.stringify(net.toJSON()));
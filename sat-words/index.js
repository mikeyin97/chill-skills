const Alexa = require('ask-sdk-core');
/* INTENT HANDLERS */
var correctDef = null;
var randomDefs = null;
var randomWord;
var fillerWord;

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    var words = Object.keys(wordList);
    randomWord = words[words.length * Math.random() << 0];
    correctDef = wordList[randomWord];
    randomDefs = [wordList[randomWord]];
    while(randomDefs.length < 3){
        fillerWord = words[words.length * Math.random() << 0];
        var randomDef = wordList[fillerWord];
        if(randomDefs.indexOf(randomDef) === -1) randomDefs.push(randomDef);
    }
    randomDefs = shuffle(randomDefs);
    var speakOut = 'What is the definition of ';
    speakOut += randomWord;
    speakOut += ". Is it one: ";
    speakOut += randomDefs[0];
    speakOut += ", two: ";
    speakOut += randomDefs[1];
    speakOut += ", or three: ";
    speakOut += randomDefs[2];
    speakOut += "?";
    return handlerInput.responseBuilder
      .speak(speakOut)
      .reprompt(speakOut)
      .getResponse();
  },
};

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    while (0 !== currentIndex) {
  
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}

const InProgressAnswerIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'AnswerIntent'
      && request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
  }
};

  
const CompletedAnswerIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AnswerIntent';
    },
    handle(handlerInput) {
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(filledSlots);
        var speechOutput = '';
        var answer = parseInt(String(slotValues.answer.synonym),10);
        if (answer > 3) {
            speechOutput += "Please give an answer that is one, two, or three";
        } else {
            if (randomDefs[answer - 1] === correctDef){
                speechOutput += "Correct!";
            } else{
                speechOutput += "Incorrect. The correct answer is ";
                speechOutput += String(randomDefs.indexOf(correctDef)+1);
                speechOutput += ", ";
                speechOutput += correctDef;
            }
        }
        return handlerInput.responseBuilder
        .speak(speechOutput)
        .getResponse();
    },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Sorry I cannot help with that.')
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Please answer with one, two, or three')
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Goodbye!')
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${handlerInput.requestEnvelope.request.type} ${handlerInput.requestEnvelope.request.type === 'IntentRequest' ? `intent: ${handlerInput.requestEnvelope.request.intent.name} ` : ''}${error.message}.`);

    return handlerInput.responseBuilder
      .speak('Sorry, I do not understand the command. Please say again.')
      .reprompt('Sorry, I do not understand the command. Please say again.')
      .getResponse();
  },
};


function getSlotValues(filledSlots) {
    const slotValues = {};

    console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
    Object.keys(filledSlots).forEach((item) => {
        const name = filledSlots[item].name;

        if (filledSlots[item] &&
        filledSlots[item].resolutions &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            case 'ER_SUCCESS_MATCH':
            slotValues[name] = {
                synonym: filledSlots[item].value,
                resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                isValidated: true,
            };
            break;
            case 'ER_SUCCESS_NO_MATCH':
            slotValues[name] = {
                synonym: filledSlots[item].value,
                resolved: filledSlots[item].value,
                isValidated: false,
            };
            break;
            default:
            break;
        }
        } else {
        slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].value,
            isValidated: false,
        };
        }
    }, this);

    return slotValues;
}


const skillBuilder = Alexa.SkillBuilders.custom();

/* LAMBDA SETUP */
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InProgressAnswerIntent,
    CompletedAnswerIntent,
    HelpHandler,
    FallbackHandler,
    ExitHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();


const wordList = {
    abate:"become less in amount or intensity",
    abdicate:"give up, such as power, as of monarchs and emperors",
    aberration:"a state or condition markedly different from the norm",
    abstain:"refrain from doing, consuming, or partaking in something",
    adversity:"a state of misfortune or affliction",
    aesthetic:"characterized by an appreciation of beauty or good taste",
    amicable:"characterized by friendship and good will",
    anachronistic:"chronologically misplaced",
    arid:"lacking sufficient water or rainfall",
    asylum:"a shelter from danger or hardship",
    benevolent:"showing or motivated by sympathy and understanding",
    bias:"a partiality preventing objective consideration of an issue",
    boisterous:"full of rough and exuberant animal spirits",
    brazen:"unrestrained by convention or propriety",
    brusque:"rudely abrupt or blunt in speech or manner",
    camaraderie:"the quality of affording easy familiarity and sociability",
    canny:"showing self-interest and shrewdness in dealing with others",
    capacious:"large in the amount that can be contained",
    capitulate:"surrender under agreed conditions",
    clairvoyant:"someone who can perceive things not present to the senses",
    collaborate:"work together on a common enterprise or project",
    compassion:"a deep awareness of and sympathy for another's suffering",
    compromise:"an accommodation in which both sides make concessions",
    condescending:"characteristic of those who treat others with arrogance",
    conditional:"imposing or depending on or containing an assumption",
    conformist:"someone who follows established standards of conduct",
    conundrum:"a difficult problem",
    convergence:"the act of coming closer",
    deleterious:"harmful to living things",
    demagogue:"a leader who seeks support by appealing to popular passions",
    digression:"a message that departs from the main subject",
    diligent:"quietly and steadily persevering in detail or exactness",
    discredit:"the state of being held in low esteem",
    disdain:"lack of respect accompanied by a feeling of intense dislike",
    divergent:"tending to move apart in different directions",
    empathy:"understanding and entering into another's feelings",
    emulate:"strive to equal or match, especially by imitating",
    enervating:"causing weakness or debilitation",
    ephemeral:"anything short-lived, as an insect that lives only for a day",
    evanescent:"tending to vanish like vapor",
    exemplary:"worthy of imitation",
    extenuating:"partially excusing or justifying",
    florid:"elaborately or excessively ornamented",
    forbearance:"a delay in enforcing rights or claims or privileges",
    fortitude:"strength of mind that enables one to endure adversity",
    fortuitous:"occurring by happy chance",
    foster:"providing nurture though not related by blood or legal ties",
    fraught:"filled with or attended with",
    frugal:"avoiding waste",
    hackneyed:"repeated too often; overfamiliar through overuse",
    haughty:"having or showing arrogant superiority",
    hedonist:"someone motivated by desires for sensual pleasures",
    hypothesis:"a tentative insight that is not yet verified or tested",
    impetuous:"characterized by undue haste and lack of thought",
    impute:"attribute or credit to",
    inconsequential:"lacking worth or importance",
    inevitable:"incapable of being avoided or prevented",
    intrepid:"invulnerable to fear or intimidation",
    intuitive:"spontaneously derived from or prompted by a natural tendency",
    jubilation:"a feeling of extreme joy",
    lobbyist:"someone who is employed to persuade how legislators vote",
    longevity:"the property of having lived for a considerable time",
    mundane:"found in the ordinary course of events",
    nonchalant:"marked by blithe unconcern",
    opulent:"rich and superior in quality",
    orator:"a person who delivers a speech",
    ostentatious:"intended to attract notice and impress others",
    parched:"dried out by heat or excessive exposure to sunlight",
    perfidious:"tending to betray",
    pragmatic:"concerned with practical matters",
    precocious:"characterized by exceptionally early development",
    pretentious:"creating an appearance of importance or distinction",
    procrastinate:"postpone doing what one should be doing",
    prosaic:"lacking wit or imagination",
    prosperity:"the condition of having good fortune",
    provocative:"serving or tending to excite or stimulate",
    prudent:"marked by sound judgment",
    querulous:"habitually complaining",
    rancorous:"showing deep-seated resentment",
    reclusive:"withdrawn from society; seeking solitude",
    reconciliation:"the reestablishment of cordial relations",
    renovation:"the act of improving by renewing and restoring",
    restrained:"under control",
    reverence:"a feeling of profound respect for someone or something",
    sagacity:"the ability to understand and discriminate between relations",
    scrutinize:"examine carefully for accuracy",
    spontaneous:"said or done without having been planned in advance",
    spurious:"plausible but false",
    submissive:"inclined or willing to give in to orders or wishes of others",
    substantiate:"establish or strengthen as with new evidence or facts",
    subtle:"difficult to detect or grasp by the mind or analyze",
    superficial:"of, affecting, or being on or near the surface",
    superfluous:"more than is needed, desired, or required",
    surreptitious:"marked by quiet and caution and secrecy",
    tactful:"having a sense of what is considerate in dealing with others",
    tenacious:"stubbornly unyielding",
    transient:"lasting a very short time",
    venerable:"profoundly honored",
    vindicate:"show to be right by providing justification or proof",
    wary:"marked by keen caution and watchful prudence"
};
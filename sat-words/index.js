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
      .reprompt('one, two, or three?')
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
    digression:"a message that departs from the main subject",
    diligent:"quietly and steadily persevering in detail or exactness",
    discredit:"the state of being held in low esteem",
    disdain:"lack of respect accompanied by a feeling of intense dislike",
    divergent:"tending to move apart in different directions",
    empathy:"understanding and entering into another's feelings",
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
    wary:"marked by keen caution and watchful prudence",
    abject:"of the most contemptible kind",
    abjure:"formally reject or disavow a formerly held belief",
    abnegation:"the denial and rejection of a doctrine or belief",
    abrogate:"revoke formally",
    abscond:"run away, often taking something or somebody along",
    abstruse:"difficult to penetrate",
    accede:"yield to another's wish or opinion",
    accost:"approach and speak to someone aggressively or insistently",
    accretion:"an increase by natural growth or addition",
    acumen:"shrewdness shown by keen insight",
    adamant:"impervious to pleas, persuasion, requests, or reason",
    admonish:"scold or reprimand; take to task",
    adumbrate:"describe roughly or give the main points or summary of",
    adverse:"in an opposing direction",
    advocate:"a person who pleads for a person, cause, or idea",
    affluent:"having an abundant supply of money or possessions of value",
    aggrandize:"embellish; increase the scope, power, or importance of",
    alacrity:"liveliness and eagerness",
    alias:"a name that has been assumed temporarily",
    ambivalent:"uncertain or unable to decide about what course to follow",
    amenable:"disposed or willing to comply",
    amorphous:"having no definite form or distinct shape",
    anathema:"a formal ecclesiastical curse accompanied by excommunication",
    annex:"attach to",
    antediluvian:"of or relating to the period before the biblical flood",
    antiseptic:"thoroughly clean and free of disease-causing organisms",
    apathetic:"showing little or no emotion or animation",
    antithesis:"exact opposite",
    apocryphal:"being of questionable authenticity",
    approbation:"official acceptance or agreement",
    arbitrary:"based on or subject to individual discretion or preference",
    arboreal:"of or relating to or formed by trees",
    arcane:"requiring secret or mysterious knowledge",
    archetypal:"of an original type after which other things are patterned",
    arrogate:"seize and take control without authority",
    ascetic:"someone who practices self denial as a spiritual discipline",
    aspersion:"a disparaging remark",
    assiduous:"marked by care and persistent effort",
    atrophy:"a decrease in size of an organ caused by disease or disuse",
    bane:"something causing misery or death",
    bashful:"self-consciously timid",
    beguile:"influence by slyness",
    bereft:"sorrowful through loss or deprivation",
    blandishment:"flattery intended to persuade",
    bilk:"cheat somebody out of what is due, especially money",
    bombastic:"ostentatiously lofty in style",
    cajole:"influence or urge by gentle urging, caressing, or flattering",
    callous:"emotionally hardened",
    calumny:"a false accusation of an offense",
    candor:"the quality of being honest and straightforward",
    carouse:"engage in boisterous, drunken merrymaking",
    carp:"any of various freshwater fish of the family Cyprinidae",
    caucus:"meet to select a candidate or promote a policy",
    cavort:"play boisterously",
    circumlocution:"an indirect way of expressing something",
    circumscribe:"draw a geometric figure around another figure",
    circumvent:"surround so as to force to give up",
    clamor:"utter or proclaim insistently and noisily",
    cleave:"separate or cut with a tool, such as a sharp instrument",
    cobbler:"a person who makes or repairs shoes",
    cogent:"powerfully persuasive",
    cognizant:"having or showing knowledge or understanding or realization",
    commensurate:"corresponding in size or degree or extent",
    complement:"something added to embellish or make perfect",
    compunction:"a feeling of deep regret, usually for some misdeed",
    concomitant:"following or accompanying as a consequence",
    conduit:"a passage through which water or electric wires can pass",
    conflagration:"a very intense and uncontrolled fire",
    congruity:"the quality of agreeing; being suitable and appropriate",
    connive:"form intrigues (for) in an underhand manner",
    consign:"give over to another for care or safekeeping",
    constituent:"one of the individual parts making up a composite entity",
    construe:"make sense of; assign a meaning to",
    contusion:"an injury in which the skin is not broken",
    contrite:"feeling or expressing pain or sorrow for sins or offenses",
    contentious:"showing an inclination to disagree",
    contravene:"go against, as of rules and laws",
    convivial:"occupied with or fond of the pleasures of good company",
    corpulence:"the property of excessive fatness",
    covet:"wish, long, or crave for",
    cupidity:"extreme greed for material wealth",
    dearth:"an insufficient quantity or number",
    debacle:"a sudden and complete disaster",
    debauch:"a wild gathering involving excessive drinking",
    debunk:"expose while ridiculing",
    defunct:"no longer in force or use; inactive",
    demagogue:"a leader who seeks support by appealing to popular passions",
    denigrate:"charge falsely or with malicious intent",
    derivative:"a compound obtained from another compound",
    despot:"a cruel and oppressive dictator",
    diaphanous:"so thin as to transmit light",
    didactic:"instructive, especially excessively",
    dirge:"a song or hymn of mourning as a memorial to a dead person",
    disaffected:"discontented as toward authority",
    discomfit:"cause to lose one's composure",
    disparate:"fundamentally different or distinct in quality or kind",
    dispel:"to cause to separate and go in different directions",
    disrepute:"the state of being held in low esteem",
    divisive:"causing or characterized by disagreement or disunity",
    dogmatic:"pertaining to a code of beliefs accepted as authoritative",
    dour:"showing a brooding ill humor",
    duplicity:"the act of deceiving or acting in bad faith",
    duress:"compulsory force or threat",
    eclectic:"selecting what seems best of various styles or ideas",
    edict:"a formal or authoritative proclamation",
    ebullient:"joyously unrestrained",
    egregious:"conspicuously and outrageously bad or reprehensible",
    elegy:"a mournful poem; a lament for the dead",
    elicit:"call forth, as an emotion, feeling, or response",
    embezzlement:"the fraudulent appropriation of funds or property",
    emend:"make corrections to",
    emollient:"a substance with a soothing effect when applied to the skin",
    empirical:"derived from experiment and observation rather than theory",
    emulate:"strive to equal or match, especially by imitating",
    enfranchise:"grant freedom to, as from slavery or servitude",
    engender:"call forth",
    epistolary:"written in the form of letters or correspondence",
    equanimity:"steadiness of mind under stress",
    equivocal:"open to two or more interpretations",
    espouse:"choose and follow a theory, idea, policy, etc.",
    evince:"give expression to",
    exacerbate:"make worse",
    exhort:"spur on or encourage especially by cheers and shouts",
    execrable:"unequivocally detestable",
    exigent:"demanding immediate attention",
    expedient:"appropriate to a purpose",
    expiate:"make amends for",
    expunge:"remove by erasing or crossing out or as if by drawing a line",
    extraneous:"not belonging to that in which it is contained",
    extol:"praise, glorify, or honor",
    extant:"still in existence; not extinct or destroyed or lost",
    expurgate:"edit by omitting or modifying parts considered indelicate",
    fallacious:"containing or based on incorrect reasoning",
    fatuous:"devoid of intelligence",
    fetter:"a shackle for the ankles or feet",
    flagrant:"conspicuously and outrageously bad or reprehensible",
    foil:"hinder or prevent, as an effort, plan, or desire",
    fractious:"easily irritated or annoyed",
    garrulous:"full of trivial conversation",
    gourmand:"a person who is devoted to eating and drinking to excess",
    grandiloquent:"lofty in style",
    gratuitous:"unnecessary and unwarranted",
    hapless:"unfortunate and deserving pity",
    hegemony:"the dominance or leadership of one social group over others",
    heterogenous:"consisting of elements that are not of the same kind",
    iconoclast:"someone who attacks cherished ideas or institutions",
    idiosyncratic:"peculiar to the individual",
    impecunious:"not having enough money to pay for necessities",
    impinge:"infringe upon",
    inane:"devoid of intelligence",
    inchoate:"only partly in existence; imperfectly formed",
    incontrovertible:"impossible to deny or disprove",
    incumbent:"necessary as a duty or responsibility; morally binding",
    inexorable:"not to be placated or appeased or moved by entreaty",
    inimical:"not friendly",
    injunction:"a judicial remedy to prohibit a party from doing something",
    inoculate:"inject or treat with the germ of a disease to render immune",
    insidious:"working or spreading in a hidden and usually injurious way",
    instigate:"provoke or stir up",
    insurgent:"in opposition to a civil authority or government",
    interlocutor:"a person who takes part in a conversation",
    intimation:"a slight suggestion or vague understanding",
    inure:"cause to accept or become hardened to",
    invective:"abusive language used to express blame or censure",
    intransigent:"impervious to pleas, persuasion, requests, or reason",
    inveterate:"habitual",
    irreverence:"a mental attitude showing lack of due respect",
    knell:"the sound of a bell rung slowly to announce a death",
    laconic:"brief and to the point",
    largesse:"liberality in bestowing gifts",
    legerdemain:"an illusory feat",
    libertarian:"an advocate of freedom of thought and speech",
    licentious:"lacking moral discipline",
    linchpin:"a central cohesive source of support and stability",
    litigant:"a party to a lawsuit",
    maelstrom:"a powerful circular current of water",
    maudlin:"effusively or insincerely emotional",
    maverick:"someone who exhibits independence in thought and action",
    mawkish:"effusively or insincerely emotional",
    maxim:"a saying that is widely accepted on its own merits",
    mendacious:"given to lying",
    modicum:"a small or moderate or token amount",
    morass:"a soft wet area of low-lying land that sinks underfoot",
    mores:"the conventions embodying the fundamental values of a group",
    munificent:"very generous",
    multifarious:"having many aspects",
    nadir:"the lowest point of anything",
    negligent:"characterized by undue lack of attention or concern",
    neophyte:"any new participant in some activity",
    noisome:"offensively malodorous",
    noxious:"injurious to physical or mental health",
    obdurate:"stubbornly persistent in wrongdoing",
    obfuscate:"make obscure or unclear",
    obstreperous:"noisily and stubbornly defiant",
    officious:"intrusive in a meddling or offensive manner",
    onerous:"burdensome or difficult to endure",
    ostensible:"appearing as such but not necessarily so",
    ostracism:"the act of excluding someone from society by general consent",
    palliate:"lessen or to try to lessen the seriousness or extent of",
    panacea:"hypothetical remedy for all ills or diseases",
    paradigm:"a standard or typical example",
    pariah:"a person who is rejected from society or home",
    partisan:"a fervent and even militant proponent of something",
    paucity:"an insufficient quantity or number",
    pejorative:"expressing disapproval",
    pellucid:"transparently clear; easily understandable",
    penchant:"a strong liking",
    penurious:"excessively unwilling to spend",
    pert:"characterized by a lightly saucy or impudent quality",
    pernicious:"exceedingly harmful",
    pertinacious:"stubbornly unyielding",
    phlegmatic:"showing little emotion",
    philanthropic:"of or relating to charitable giving",
    pithy:"concise and full of meaning",
    platitude:"a trite or obvious remark",
    plaudit:"enthusiastic approval",
    plenitude:"a full supply",
    plethora:"extreme excess",
    portent:"a sign of something about to happen",
    potentate:"a ruler who is unconstrained by law",
    preclude:"make impossible, especially beforehand",
    predilection:"a predisposition in favor of something",
    preponderance:"exceeding in heaviness; having greater weight",
    presage:"a foreboding about what is about to happen",
    probity:"complete and confirmed integrity",
    proclivity:"a natural inclination",
    profligate:"unrestrained by convention or morality",
    promulgate:"state or announce",
    proscribe:"command against",
    protean:"taking on different forms",
    prurient:"characterized by lust",
    puerile:"displaying or suggesting a lack of maturity",
    pugnacious:"ready and able to resort to force or violence",
    pulchritude:"physical beauty, especially of a woman",
    punctilious:"marked by precise accordance with details",
    quaint:"attractively old-fashioned",
    quixotic:"not sensible about practical matters",
    quandary:"state of uncertainty in a choice between unfavorable options",
    recalcitrant:"stubbornly resistant to authority or control",
    redoubtable:"inspiring fear",
    relegate:"assign to a lower position",
    remiss:"failing in what duty requires",
    reprieve:"postpone the punishment of a convicted criminal",
    reprobate:"a person without moral scruples",
    rescind:"cancel officially",
    requisition:"an authoritative request or demand",
    rife:"excessively abundant",
    sanctimonious:"excessively or hypocritically pious",
    sanguine:"confidently optimistic and cheerful",
    scurrilous:"expressing offensive reproach",
    semaphore:"an apparatus for visual signaling",
    serendipity:"good luck in making unexpected and fortunate discoveries",
    sobriety:"the state of being unaffected or not intoxicated by alcohol",
    solicitous:"full of anxiety and concern",
    solipsism:"the philosophical theory that the self is all that exists",
    staid:"characterized by dignity and propriety",
    stolid:"having or revealing little emotion or sensibility",
    subjugate:"make subservient; force to submit or subdue",
    surfeit:"indulge (one's appetite) to satiety",
    swarthy:"naturally having skin of a dark color",
    tangential:"of superficial relevance if any",
    tome:"a large and scholarly book",
    toady:"a person who tries to please someone to gain an advantage",
    torpid:"in a condition of biological rest or suspended animation",
    travesty:"a composition that imitates or misrepresents a style",
    trenchant:"having keenness and forcefulness and penetration in thought",
    trite:"repeated too often; overfamiliar through overuse",
    truculent:"defiantly aggressive",
    turpitude:"a corrupt or depraved or degenerate act or practice",
    ubiquitous:"being present everywhere at once",
    umbrage:"a feeling of anger caused by being offended",
    upbraid:"express criticism towards",
    utilitarian:"having a useful function",
    veracity:"unwillingness to tell lies",
    vestige:"an indication that something has been present",
    vicissitude:"a variation in circumstances or fortune",
    vilify:"spread negative information about",
    virtuoso:"someone who is dazzlingly skilled in any field",
    vitriolic:"harsh, bitter, or malicious in tone",
    vituperate:"spread negative information about",
    vociferous:"conspicuously and offensively loud",
    wanton:"a lewd or lascivious person",
    winsome:"charming in a childlike or naive way",
    yoke:"join with stable gear, as two draft animals",
    zephyr:"a slight wind",
    wily:"marked by skill in deception",
    tirade:"a speech of violent denunciation"
};
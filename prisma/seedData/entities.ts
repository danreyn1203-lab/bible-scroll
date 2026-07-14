// Knowledge-graph nodes: the durable "things" content connects to.
// Every entity has: id, type, label, and a short summary (used today by
// aiClient.explainHistory() as the v1 "explanation"; future AI elaborates on it).

export const ENTITY_TYPES = {
  book:       {label: "Book",       icon: "📖"},
  person:     {label: "Person",     icon: "🧍"},
  place:      {label: "Place",      icon: "📍"},
  event:      {label: "Event",      icon: "⚡"},
  theme:      {label: "Theme",      icon: "✦"},
  doctrine:   {label: "Doctrine",   icon: "✝"},
  word:       {label: "Word",       icon: "𐤀"},
  period:     {label: "Period",     icon: "⏳"},
  theologian: {label: "Theologian", icon: "🪶"},
  artifact:   {label: "Artifact",   icon: "🏺"},
};

export const ENTITIES = [
  // ---- Books ----
  {id:"book.genesis", type:"book", label:"Genesis", summary:"The book of beginnings — creation, the fall, the patriarchs, and the descent into Egypt."},
  {id:"book.exodus", type:"book", label:"Exodus", summary:"Israel's deliverance from Egypt and the giving of the Law at Sinai."},
  {id:"book.psalms", type:"book", label:"Psalms", summary:"150 songs and prayers spanning praise, lament, and trust."},
  {id:"book.proverbs", type:"book", label:"Proverbs", summary:"Wisdom literature for ordinary life, attributed largely to Solomon."},
  {id:"book.isaiah", type:"book", label:"Isaiah", summary:"Prophecies of judgment and hope, including the clearest Messianic portraits in the Old Testament."},
  {id:"book.jeremiah", type:"book", label:"Jeremiah", summary:"The 'weeping prophet's' warnings to Judah before the exile to Babylon."},
  {id:"book.lamentations", type:"book", label:"Lamentations", summary:"Five poems mourning Jerusalem's fall, ending in defiant hope."},
  {id:"book.jonah", type:"book", label:"Jonah", summary:"A reluctant prophet sent to Israel's enemy, Nineveh."},
  {id:"book.matthew", type:"book", label:"Matthew", summary:"Jesus presented as the promised King, written for a Jewish audience."},
  {id:"book.mark", type:"book", label:"Mark", summary:"The fastest-paced Gospel, emphasizing Jesus' action and suffering."},
  {id:"book.luke", type:"book", label:"Luke", summary:"A doctor's carefully researched account, emphasizing Jesus' compassion for the outsider."},
  {id:"book.john", type:"book", label:"John", summary:"A theological Gospel built around seven signs and 'I am' statements."},
  {id:"book.acts", type:"book", label:"Acts", summary:"The Spirit-empowered spread of the church from Jerusalem to Rome."},
  {id:"book.romans", type:"book", label:"Romans", summary:"Paul's fullest explanation of the gospel — sin, grace, justification, and new life."},
  {id:"book.galatians", type:"book", label:"Galatians", summary:"Paul's urgent defense of justification by faith alone against legalism."},
  {id:"book.philippians", type:"book", label:"Philippians", summary:"A joyful letter from prison about contentment and Christ's example."},
  {id:"book.1corinthians", type:"book", label:"1 Corinthians", summary:"Paul addresses division, ethics, worship, and the resurrection in a troubled church."},
  {id:"book.1peter", type:"book", label:"1 Peter", summary:"Encouragement to suffering Christians scattered across the empire."},
  {id:"book.revelation", type:"book", label:"Revelation", summary:"A vision of Christ's ultimate victory and the renewal of all things."},
  {id:"book.numbers", type:"book", label:"Numbers", summary:"Israel's wilderness wanderings between Sinai and the edge of Canaan."},
  {id:"book.joshua", type:"book", label:"Joshua", summary:"The conquest and settlement of the promised land."},
  {id:"book.2kings", type:"book", label:"2 Kings", summary:"The divided kingdom's decline, ending in exile."},
  {id:"book.1kings", type:"book", label:"1 Kings", summary:"Solomon's glory, the kingdom's split, and the ministry of Elijah."},
  {id:"person.elijah", type:"person", label:"Elijah", summary:"Fiery prophet who confronted Baal worship and was taken up in a whirlwind."},
  {id:"person.elisha", type:"person", label:"Elisha", summary:"Elijah's successor, who inherited a double portion of his spirit and worked many miracles."},
  {id:"person.ahab", type:"person", label:"Ahab", summary:"Idolatrous king of the northern kingdom, opposed by the prophet Elijah."},
  {id:"place.carmel", type:"place", label:"Mount Carmel", summary:"The mountain ridge where Elijah faced down the prophets of Baal and fire fell from heaven."},
  {id:"book.1samuel", type:"book", label:"1 Samuel", summary:"Israel's transition from judges to monarchy — Saul and the rise of David."},
  {id:"book.esther", type:"book", label:"Esther", summary:"A Jewish queen's courage saves her people in Persia — God unnamed, providence everywhere."},

  // ---- People ----
  {id:"person.paul", type:"person", label:"Paul", summary:"Former persecutor turned apostle to the Gentiles; wrote roughly half the New Testament."},
  {id:"person.david", type:"person", label:"David", summary:"Shepherd-turned-king, ancestor of Jesus, author of many Psalms."},
  {id:"person.moses", type:"person", label:"Moses", summary:"Led Israel out of Egypt and received the Law at Sinai."},
  {id:"person.jesus", type:"person", label:"Jesus", summary:"The Son of God incarnate — the center of the entire biblical story."},
  {id:"person.jonah", type:"person", label:"Jonah", summary:"A prophet who fled his calling, then preached judgment and saw mercy."},
  {id:"person.pilate", type:"person", label:"Pontius Pilate", summary:"Roman governor of Judea who presided over Jesus' trial."},
  {id:"person.balaam", type:"person", label:"Balaam", summary:"A hired prophet rebuked by his own donkey on the way to curse Israel."},
  {id:"person.esther", type:"person", label:"Esther", summary:"Jewish queen of Persia whose courage saved her people."},
  {id:"person.goliath", type:"person", label:"Goliath", summary:"A Philistine giant felled by a shepherd boy's sling."},
  {id:"person.hezekiah", type:"person", label:"Hezekiah", summary:"Reforming king of Judah who fortified Jerusalem's water supply."},
  {id:"person.methuselah", type:"person", label:"Methuselah", summary:"The longest-lived person recorded in Scripture, at 969 years."},
  {id:"person.noah", type:"person", label:"Noah", summary:"Built the ark and survived the flood, found righteous in a corrupt generation."},
  {id:"person.saul", type:"person", label:"Saul", summary:"Israel's first king — gifted but increasingly disobedient, eventually rejected by God."},
  {id:"person.samuel", type:"person", label:"Samuel", summary:"Prophet and judge who anointed both Saul and David as king."},

  // ---- Places ----
  {id:"place.jericho", type:"place", label:"Jericho", summary:"One of the oldest continuously inhabited cities on earth."},
  {id:"place.qumran", type:"place", label:"Qumran", summary:"Site where the Dead Sea Scrolls were discovered in 1947."},
  {id:"place.caesarea", type:"place", label:"Caesarea Maritima", summary:"Roman administrative city where the 'Pilate Stone' was unearthed."},
  {id:"place.jerusalem", type:"place", label:"Jerusalem", summary:"Israel's spiritual and political center across both Testaments."},
  {id:"place.nineveh", type:"place", label:"Nineveh", summary:"Capital of ancient Assyria, the reluctant mission field of Jonah."},
  {id:"place.eden", type:"place", label:"Eden", summary:"The garden of humanity's first home, and first loss."},
  {id:"place.mesopotamia", type:"place", label:"Ancient Mesopotamia", summary:"The river-valley cradle of civilization between the Tigris and Euphrates, home to flood traditions that echo Genesis."},
  {id:"place.temple", type:"place", label:"The Temple", summary:"Israel's central place of worship in Jerusalem, first built by Solomon."},

  // ---- Events ----
  {id:"event.exile", type:"event", label:"Babylonian Exile", summary:"Judah's deportation to Babylon after Jerusalem's fall, c. 586 BC."},
  {id:"event.resurrection", type:"event", label:"The Resurrection", summary:"Christ's rising from the dead, the hinge of the Christian faith."},
  {id:"event.crucifixion", type:"event", label:"The Crucifixion", summary:"Jesus' death on the cross, where grace and justice meet."},
  {id:"event.census", type:"event", label:"Augustus' Census", summary:"The Roman census that providentially placed Jesus' birth in Bethlehem."},
  {id:"event.printing", type:"event", label:"Gutenberg's Press", summary:"The printing revolution that began, fittingly, with the Bible."},
  {id:"event.flood", type:"event", label:"The Flood", summary:"A global judgment and a fresh start, preserved through one righteous family."},

  // ---- Artifacts ----
  {id:"artifact.ark-covenant", type:"artifact", label:"Ark of the Covenant", summary:"The gold-covered chest holding the tablets of the Law — the visible sign of God's presence with Israel."},

  // ---- Themes ----
  {id:"theme.grace", type:"theme", label:"Grace", summary:"Unearned favor — God's costly mercy toward the undeserving."},
  {id:"theme.justification", type:"theme", label:"Justification", summary:"Being declared righteous through Christ, not through one's own merit."},
  {id:"theme.trust", type:"theme", label:"Trust", summary:"Resting in God's character even without full understanding."},
  {id:"theme.providence", type:"theme", label:"Providence", summary:"God's unseen hand directing events, even when he is not named."},
  {id:"theme.suffering", type:"theme", label:"Suffering", summary:"How faith holds together with pain, loss, and grief."},
  {id:"theme.hope", type:"theme", label:"Hope", summary:"Confident expectation grounded in God's promises, not circumstances."},
  {id:"theme.identity", type:"theme", label:"Identity in God", summary:"Who a person is because of whose they are."},
  {id:"theme.mercy", type:"theme", label:"Mercy", summary:"Compassion extended to those who least expect it — even Israel's enemies."},
  {id:"theme.repentance", type:"theme", label:"Repentance", summary:"Turning from self-rule back toward God."},
  {id:"theme.scripture-reliability", type:"theme", label:"Scripture's Reliability", summary:"The historical and manuscript evidence behind the biblical text."},
  {id:"theme.covenant", type:"theme", label:"Covenant", summary:"God's binding promise to his people — the thread connecting Noah, Abraham, Moses, David, and Christ."},
  {id:"theme.symbolism", type:"theme", label:"Symbolism", summary:"Objects, animals, and numbers in Scripture that carry meaning beyond their plain sense."},

  // ---- Doctrines ----
  {id:"doctrine.trinity", type:"doctrine", label:"The Trinity", summary:"One God eternally existing as Father, Son, and Spirit."},
  {id:"doctrine.sanctification", type:"doctrine", label:"Sanctification", summary:"The Spirit's ongoing work of shaping believers into Christ's likeness."},
  {id:"doctrine.imago-dei", type:"doctrine", label:"Image of God", summary:"Every person bears a God-given dignity that cannot be erased."},
  {id:"doctrine.new-creation", type:"doctrine", label:"New Creation", summary:"Heaven coming down — a renewed creation where God dwells with his people."},

  // ---- Theologians ----
  {id:"theologian.augustine", type:"theologian", label:"Augustine", summary:"4th-century bishop of Hippo whose writing on grace and the Trinity shaped a thousand years of theology."},
  {id:"theologian.luther", type:"theologian", label:"Martin Luther", summary:"Reformer whose rediscovery of justification by faith ignited the Protestant Reformation."},
  {id:"theologian.calvin", type:"theologian", label:"John Calvin", summary:"Reformer whose systematic account of grace and providence shaped Reformed theology."},
  {id:"theologian.aquinas", type:"theologian", label:"Thomas Aquinas", summary:"Medieval theologian whose synthesis of faith and reason still anchors much Christian doctrine."},

  // ---- Words ----
  {id:"word.biblia", type:"word", label:"τὰ βιβλία (ta biblia)", summary:"Greek for 'the books' — the origin of the English word 'Bible.'"},
  {id:"word.hesed", type:"word", label:"חֶסֶד (hesed)", summary:"Hebrew for steadfast, covenantal love — richer than 'mercy' alone."},
  {id:"word.teba", type:"word", label:"תֵּבָה (tevah)", summary:"Hebrew for 'ark' or 'box' — the same rare word used for both Noah's vessel and baby Moses' basket."},
  {id:"word.berith", type:"word", label:"בְּרִית (berith)", summary:"Hebrew for 'covenant' — a binding promise sealed by ritual, not just a verbal agreement."},

  // ---- Periods ----
  {id:"period.patriarchal", type:"period", label:"Patriarchal Era", summary:"c. 2000–1500 BC — Abraham, Isaac, Jacob, and the founding promises."},
  {id:"period.exodus", type:"period", label:"Exodus & Wilderness", summary:"c. 1450–1400 BC — deliverance from Egypt and 40 years of wandering."},
  {id:"period.monarchy", type:"period", label:"United & Divided Monarchy", summary:"c. 1050–586 BC — Saul through the fall of Jerusalem."},
  {id:"period.exile-return", type:"period", label:"Exile & Return", summary:"586–c. 400 BC — Babylonian captivity and the return under Persian rule."},
  {id:"period.second-temple", type:"period", label:"Second Temple Era", summary:"c. 515 BC–AD 70 — the world Jesus and the apostles were born into."},
  {id:"period.apostolic", type:"period", label:"Apostolic Age", summary:"c. AD 30–100 — the life of the early church and the writing of the New Testament."},
];

export const entityIndex = new Map(ENTITIES.map(e => [e.id, e]));

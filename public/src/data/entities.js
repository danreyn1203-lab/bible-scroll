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
  {id:"book.1kings", type:"book", label:"1 Kings", summary:"Solomon's glory, the kingdom's split, and the ministry of Elijah."},
  {id:"book.2kings", type:"book", label:"2 Kings", summary:"The divided kingdom's decline, ending in exile."},
  {id:"book.1samuel", type:"book", label:"1 Samuel", summary:"Israel's transition from judges to monarchy — Saul and the rise of David."},
  {id:"book.esther", type:"book", label:"Esther", summary:"A Jewish queen's courage saves her people in Persia — God unnamed, providence everywhere."},

  // ---- People ----
  // `bio` is the longer "Manna card" write-up; `summary` stays the one-line teaser.
  // `era` and `also` (also-known-as / title) render as quick facts on the card.
  {id:"person.paul", type:"person", label:"Paul", summary:"Former persecutor turned apostle to the Gentiles; wrote roughly half the New Testament.", era:"c. AD 5 – c. AD 67", also:"Apostle to the Gentiles", bio:"Born Saul of Tarsus, a zealous Pharisee who violently persecuted the early church, Paul was confronted by the risen Christ on the road to Damascus and became Christianity's most tireless missionary. Across three journeys he planted churches throughout the Roman world and wrote thirteen New Testament letters — including Romans, his fullest explanation of grace. Tradition holds he was martyred in Rome under Nero."},
  {id:"person.david", type:"person", label:"David", summary:"Shepherd-turned-king, ancestor of Jesus, author of many Psalms.", era:"c. 1040 – 970 BC", also:"King of Israel", bio:"The youngest son of Jesse, David rose from tending sheep to defeating the giant Goliath and eventually uniting Israel as its greatest king. A gifted poet and musician, he wrote many of the Psalms, pouring out both soaring praise and raw lament. Though he fell gravely — most infamously with Bathsheba — God called him 'a man after my own heart,' and promised that the Messiah would come from his line."},
  {id:"person.moses", type:"person", label:"Moses", summary:"Led Israel out of Egypt and received the Law at Sinai.", era:"c. 1400s BC", also:"The Lawgiver", bio:"Rescued as a baby from Pharaoh's death decree and raised in the Egyptian court, Moses fled to the desert before God called him from a burning bush to free the Israelites from slavery. Through him came the ten plagues, the parting of the Red Sea, and the giving of the Law at Mount Sinai. He led the people forty years through the wilderness, speaking with God 'face to face,' yet died within sight of the Promised Land."},
  {id:"person.jesus", type:"person", label:"Jesus", summary:"The Son of God incarnate — the center of the entire biblical story.", era:"c. 4 BC – c. AD 30", also:"The Messiah, the Christ", bio:"Born in Bethlehem to a virgin, Jesus of Nazareth taught with unmatched authority, healed the sick, and welcomed outcasts, announcing the arrival of God's kingdom. Christians confess him as fully God and fully human — the promised Messiah of Israel. His crucifixion under Pontius Pilate and resurrection three days later stand as the hinge of the Christian faith and the center of the whole biblical story."},
  {id:"person.jonah", type:"person", label:"Jonah", summary:"A prophet who fled his calling, then preached judgment and saw mercy.", era:"c. 8th century BC", also:"The reluctant prophet", bio:"Called to preach to Nineveh, the capital of Israel's brutal enemy Assyria, Jonah instead sailed the opposite direction — and was swallowed by a great fish after being thrown overboard in a storm. Delivered onto dry land, he finally preached, and to his dismay the whole city repented and was spared. His short book is a pointed lesson on the reach of God's mercy, even to those we'd rather see judged."},
  {id:"person.pilate", type:"person", label:"Pontius Pilate", summary:"Roman governor of Judea who presided over Jesus' trial.", era:"governed AD 26 – 36", also:"Prefect of Judea", bio:"The Roman prefect of Judea under Emperor Tiberius, Pilate presided over the trial of Jesus. The Gospels portray him as finding no guilt yet yielding to the crowd, famously washing his hands of the decision before ordering the crucifixion. Once doubted by skeptics as unhistorical, his existence was confirmed by the 1961 discovery of the 'Pilate Stone' at Caesarea."},
  {id:"person.balaam", type:"person", label:"Balaam", summary:"A hired prophet rebuked by his own donkey on the way to curse Israel.", era:"c. 1400s BC", also:"The hired seer", bio:"A pagan diviner hired by King Balak of Moab to curse the advancing Israelites, Balaam set out despite God's warning — until his donkey saw an angel blocking the road and spoke aloud to rebuke him. Each time he opened his mouth to curse Israel, blessing came out instead. He became a byword in Scripture for prophets who love the wages of wrongdoing."},
  {id:"person.esther", type:"person", label:"Esther", summary:"Jewish queen of Persia whose courage saved her people.", era:"c. 5th century BC", also:"Queen of Persia", bio:"A Jewish orphan raised by her cousin Mordecai, Esther became queen of Persia — and was positioned 'for such a time as this' when a royal official plotted to exterminate the Jews. Risking her life to approach the king uninvited, she exposed the scheme and turned the empire's power to her people's rescue. Her book never names God, yet his providence runs through every turn, and it grounds the feast of Purim."},
  {id:"person.goliath", type:"person", label:"Goliath", summary:"A Philistine giant felled by a shepherd boy's sling.", era:"c. 1020s BC", also:"Champion of the Philistines", bio:"A towering Philistine warrior from Gath who taunted Israel's army for forty days, daring anyone to face him in single combat. The shepherd boy David answered, refusing armor and trusting God, then dropped the giant with a single stone from his sling. Their duel became history's enduring image of a faith-filled underdog toppling an overwhelming foe."},
  {id:"person.hezekiah", type:"person", label:"Hezekiah", summary:"Reforming king of Judah who fortified Jerusalem's water supply.", era:"reigned c. 715 – 686 BC", also:"King of Judah", bio:"One of Judah's most faithful kings, Hezekiah tore down idols and restored true worship in Jerusalem. When Assyria besieged the city, he carved a 1,750-foot tunnel through solid rock to secure its water supply, then trusted God for a deliverance that came overnight. An inscription describing the tunnel's completion was later found inside it."},
  {id:"person.methuselah", type:"person", label:"Methuselah", summary:"The longest-lived person recorded in Scripture, at 969 years.", era:"antediluvian era", also:"Grandfather of Noah", bio:"Listed in Genesis as the grandfather of Noah, Methuselah lived 969 years — the longest lifespan recorded in the Bible. His name became a proverb for extreme old age. Reading the genealogy closely, his death falls in the very year of the great flood."},
  {id:"person.noah", type:"person", label:"Noah", summary:"Built the ark and survived the flood, found righteous in a corrupt generation.", era:"antediluvian era", also:"Builder of the Ark", bio:"In a generation so corrupt that God resolved to wash the earth clean, Noah alone 'found favor' and was called to build an enormous ark. He preserved his family and pairs of every kind of animal through a world-covering flood, then stepped out into a renewed creation. God sealed the moment with a covenant and the sign of the rainbow — a promise never to flood the earth again."},
  {id:"person.saul", type:"person", label:"Saul", summary:"Israel's first king — gifted but increasingly disobedient, eventually rejected by God.", era:"reigned c. 1050 – 1010 BC", also:"First king of Israel", bio:"Chosen as Israel's first king when the people demanded a monarch 'like the other nations,' Saul was tall, striking, and initially humble. But repeated disobedience and jealousy — especially toward the rising young David — led God to reject him from the throne. He died in battle against the Philistines, a cautionary study in a promising start undone by pride."},
  {id:"person.samuel", type:"person", label:"Samuel", summary:"Prophet and judge who anointed both Saul and David as king.", era:"c. 11th century BC", also:"The last judge", bio:"Given to God by his mother Hannah and raised in the tabernacle, Samuel heard God's voice as a boy and grew into Israel's last judge and a trusted prophet. He anointed Saul as the nation's first king, and later, when Saul faltered, secretly anointed the shepherd David. He stands as the bridge between the era of the judges and the age of Israel's kings."},
  {id:"person.elijah", type:"person", label:"Elijah", summary:"Fiery prophet who confronted Baal worship and was taken up in a whirlwind.", era:"c. 9th century BC", also:"The Tishbite", bio:"The boldest of Israel's prophets, Elijah confronted the wicked King Ahab and Queen Jezebel over their worship of Baal. On Mount Carmel he challenged 450 prophets of Baal to a contest, and fire fell from heaven to consume his water-drenched sacrifice. Worn down afterward, he met God not in wind or fire but in a 'still small voice.' He never died an ordinary death — he was carried to heaven in a whirlwind by chariots of fire, and Scripture promised his return before the Messiah, a hope the New Testament links to John the Baptist."},
  {id:"person.elisha", type:"person", label:"Elisha", summary:"Elijah's successor, who inherited a double portion of his spirit and worked many miracles.", era:"c. 9th century BC", also:"Successor to Elijah", bio:"Called from plowing his family's fields, Elisha followed Elijah and asked for a 'double portion' of his spirit. When Elijah was taken up, Elisha took up his fallen mantle and carried on his ministry, working more recorded miracles than any prophet before Christ — purifying water, multiplying oil for a widow, and raising a boy from the dead. His life shows the quiet, healing side of prophetic power."},
  {id:"person.ahab", type:"person", label:"Ahab", summary:"Idolatrous king of the northern kingdom, opposed by the prophet Elijah.", era:"reigned c. 874 – 853 BC", also:"King of Israel", bio:"A king of the northern kingdom of Israel, Ahab married the Phoenician princess Jezebel and led the nation into open Baal worship, drawing the fierce opposition of the prophet Elijah. Scripture judges that he 'did more evil than all who were before him.' His dynasty was later swept away exactly as the prophets foretold."},

  // ---- Places ----
  {id:"place.jericho", type:"place", label:"Jericho", summary:"One of the oldest continuously inhabited cities on earth."},
  {id:"place.qumran", type:"place", label:"Qumran", summary:"Site where the Dead Sea Scrolls were discovered in 1947."},
  {id:"place.caesarea", type:"place", label:"Caesarea Maritima", summary:"Roman administrative city where the 'Pilate Stone' was unearthed."},
  {id:"place.jerusalem", type:"place", label:"Jerusalem", summary:"Israel's spiritual and political center across both Testaments."},
  {id:"place.nineveh", type:"place", label:"Nineveh", summary:"Capital of ancient Assyria, the reluctant mission field of Jonah."},
  {id:"place.eden", type:"place", label:"Eden", summary:"The garden of humanity's first home, and first loss."},
  {id:"place.mesopotamia", type:"place", label:"Ancient Mesopotamia", summary:"The river-valley cradle of civilization between the Tigris and Euphrates, home to flood traditions that echo Genesis."},
  {id:"place.temple", type:"place", label:"The Temple", summary:"Israel's central place of worship in Jerusalem, first built by Solomon."},
  {id:"place.carmel", type:"place", label:"Mount Carmel", summary:"The mountain ridge where Elijah faced down the prophets of Baal and fire fell from heaven."},

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

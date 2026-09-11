export const HEN_HUMOR = `Humor:
- Vridningen är poängen. Hönshuset ska vara lustigt att läsa, inte en dyster rapport med andra djur.
- Byt ut saken, inte bara människorna. Hitta vad nyheten handlar om och gör om den till något som redan finns i hönshuset, sen bygg artikeln på det. Sylt som inte får heta sylt blir ägg som inte får heta ägg. En båt blir flytbo. Låt inte originalets produktnamn styra om ett hönsord är roligare. En redan löjlig byråkratterm som "beredning" kan få följa med.
- Ju mörkare originalet är, desto lustigare måste hönshusbeskrivningen bli: mer skev, mer disproportion, mer kackel. Tråden ska ändå gå att följa: vad som hänt, vem, var, vad som följde.
- Skriv inte räddningsrapport, lägesuppdatering eller "DIREKT". Även en dödsfälla, en krasch eller ett rävanfall ska berättas som kvällstidning i hönshuset.
- Skratta inte åt olyckan och inte åt offer. Skratta åt omskrivningen. Billig grymhet ger fel ton.`

export const HEN_LEXICON = `Lexikon (använd alltid, utan undantag). Byt ut allt som går att byta:
- barn = kyckling
- kvinna = höna
- man = tupp
- ungdom = unghöns (unghöna / ungtupp)
- bäbis = dununge
- åldring = gammelhöns (gammelhöna / gammeltupp)
- kriminell = räv
- död = plockad
- lik = fjäderhög
- länder = gårdar (Sverige = Gården, andra länder = den danska gården, den norska gården, osv.)
- politiker, ministrar, kändisar, kungligheter, tränare, poliser, läkare, lärare, piloter och andra yrken = hönsiga titlar (gårdsråd, foderminster, Högsta pinnen, Övertuppen, hönsvakt, redesdoktor, kläckmästare, hönsplanpilot)
- pengar = korn / fodersäck
- fotboll och matcher = maskkamp / pinnkamp
- bilar, plan, hus, skolor, sjukhus, fängelser = rullbo, hönsplan, rede, kläckhus, vårdbur, rävsax
- båtar, skepp, färjor = flytbo. Aldrig rullbo.
- Andra substantiv: hönsa eller tuppifiera där det bär (olycka, utredning, räddning, möte). Saken i nyheten ska bytas till hönshuset — inte hängas kvar som människornas burk, lag eller varumärke. Inte där ett extra påhittat ord blir krystat ovanpå. Skriv aldrig kadaver.`

export const HEN_NAMES = `Namn och röster:
- Lämna inga mänskliga egennamn orörda. Lek med dem så att de blir fökycklade, hönsiga eller tuppiga, men fortfarande igenkännliga. Ulf Kristersson kan bli Ulf Kackelsson, Magdalena Andersson Magda Andhönan, Trump Tuppen Trump, Zelenskyj Zelenskycklingen.
- Det går att rapportera OM människor ur hönsperspektiv: vad de gjort, vad gården tycker. Deras namn ska ändå hönsas.
- Människor intervjuas aldrig. Citat kommer bara från höns- och tuppsläktet: Överhönan, hönsvakt, taleshöna, granntupp, foderminster, med lustiga fökycklade namn.
- Skriv inte Zelenskyj, Putin, Trump, Andersson eller andra efternamn i mänsklig form. Skriv inte Göran, macka eller andra mänskliga statister som inte hör till rubriken.`

export const HEN_LEXICON_EN = `Lexicon (always use, no exceptions). Swap everything that can be swapped:
- child = chick
- woman = hen
- man = rooster
- youth = pullet (young hen / cockerel)
- baby = fluffball / chick
- elderly = old hen / old rooster
- criminal = fox
- dead = plucked
- corpse = feather pile
- countries = yards (Sweden = the Yard, other countries = the Danish yard, the Norwegian yard, and so on)
- politicians, ministers, celebrities, royals, coaches, police, doctors, teachers, pilots and other jobs = hen titles (yard council, feed minister, Top Perch, Head Rooster, hen-guard, nest doctor, hatch-master, henplane pilot)
- money = corn / feed sack
- football and matches = worm match / stick match
- cars, planes, houses, schools, hospitals, prisons = roll-coop, henplane, nest, hatch-house, care cage, fox trap
- boats, ships, ferries = float-coop. Never roll-coop.
- Other nouns: henify or roosterify where it carries (accident, inquiry, rescue, meeting). Swap the thing in the news into the henhouse — do not leave it as the humans' tin, law or brand. Not where an extra made-up word becomes strained on top. Never write carcass.`

export const HEN_NAMES_EN = `Names and voices:
- Leave no human proper names untouched. Play with them so they become hen-like, roosterish or clucky, but still recognizable. Ulf Kristersson can become Ulf Clucksson, Magdalena Andersson Magda Andhen, Trump Rooster Trump, Zelensky Zelenskycken.
- You can report ON people from a hen perspective: what they did, what the yard thinks. Their names must still be hen-ified.
- Humans are never interviewed. Quotes only come from hens and roosters: Head Hen, hen-guard, spokeshen, neighbor rooster, feed minister, with funny hen-ified names.
- Do not write Zelensky, Putin, Trump, Andersson or other surnames in human form. Do not write extra human extras who do not belong in the headline.`

export function henLexiconForLanguage(language: 'sv' | 'en'): string {
  return language === 'en' ? HEN_LEXICON_EN : HEN_LEXICON
}

export function henNamesForLanguage(language: 'sv' | 'en'): string {
  return language === 'en' ? HEN_NAMES_EN : HEN_NAMES
}

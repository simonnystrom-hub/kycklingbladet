export const DELETION_UPDATED = '5 september 2026'

export const DELETION_INTRO =
  'Så här begär du att Kycklingbladet raderar personuppgifter vi behandlar om dig. Sidan uppfyller Metas krav på en data deletion instructions URL. Kycklingbladet har ingen Facebook-inloggning och sparar inga Facebook-användar-id.'

export const DELETION_SECTIONS: {heading: string; paragraphs: string[]}[] = [
  {
    heading: 'Uppgifter du skickat via sajten',
    paragraphs: [
      'Om du har skrivit till oss via kontaktsidan behandlar vi namn, e-postadress och meddelande. Begär radering på kontaktsidan. Skriv att du vill att personuppgifterna ska raderas och ange samma e-postadress som du använde. Vi kan behöva säkerställa att begäran kommer från dig.',
      'När begäran är bekräftad raderar vi kontaktmeddelandet ur vårt system, såvida vi inte måste spara något en kortare tid på grund av en rättslig skyldighet.',
    ],
  },
  {
    heading: 'Besök på webbplatsen',
    paragraphs: [
      'Vi har inga användarkonton. Tekniska serverloggar hos driftleverantören raderas enligt deras ordinarie, korta rutiner. Det finns inget konto att stänga.',
    ],
  },
  {
    heading: 'Facebook',
    paragraphs: [
      'Kycklingbladets Meta-app används för att publicera vårt redaktionella innehåll på vår Facebooksida. Appen samlar inte in din Facebook-profil och lagrar inte ditt Facebook-id.',
      'Kommentarer, reaktioner och annat du själv lämnar på Facebook hanteras av Meta. Radera eller begränsa det i Facebooks egna inställningar. Våra publicerade artiklar och bilder på sidan är redaktionellt material och raderas inte för att någon begär det via denna instruktion.',
    ],
  },
  {
    heading: 'Svarstid',
    paragraphs: [
      'Vi hanterar raderingsbegäran utan onödigt dröjsmål, senast inom en månad. Vid komplicerade ärenden kan tiden förlängas enligt GDPR. Du får besked via den e-post du uppgett, om det går att nå dig den vägen.',
    ],
  },
]

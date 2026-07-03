/* Lucide icon paths (ISC-licensed, github.com/lucide-icons/lucide) as tiny
   React components. Stroke 2, round caps — matches lucide-angular in jig. */
const S = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      width: '1em',
      height: '1em',
      'aria-hidden': 'true',
      ...props,
    },
    props.children,
  );
const P = (d) => React.createElement('path', { d });

const Icons = {
  home: () => <S><P d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><P d="M9 22V12h6v10"/></S>,
  box: () => <S><P d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><P d="m3.3 7 8.7 5 8.7-5"/><P d="M12 22V12"/></S>,
  users: () => <S><P d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><P d="M22 21v-2a4 4 0 0 0-3-3.87"/><P d="M16 3.13a4 4 0 0 1 0 7.75"/></S>,
  cog: () => <S><circle cx="12" cy="12" r="3"/><P d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></S>,
  search: () => <S><circle cx="11" cy="11" r="8"/><P d="m21 21-4.3-4.3"/></S>,
  bell: () => <S><P d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><P d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></S>,
  panelLeft: () => <S><rect width="18" height="18" x="3" y="3" rx="2"/><P d="M9 3v18"/></S>,
  plus: () => <S><P d="M5 12h14"/><P d="M12 5v14"/></S>,
  gitBranch: () => <S><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><P d="M18 9a9 9 0 0 1-9 9"/></S>,
  terminal: () => <S><P d="m4 17 6-6-6-6"/><line x1="12" x2="20" y1="19" y2="19"/></S>,
  creditCard: () => <S><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></S>,
  fileText: () => <S><P d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><P d="M14 2v5h5"/><line x1="9" x2="15" y1="13" y2="13"/><line x1="9" x2="15" y1="17" y2="17"/></S>,
  check: () => <S><P d="M20 6 9 17l-5-5"/></S>,
  arrowRight: () => <S><P d="M5 12h14"/><P d="m12 5 7 7-7 7"/></S>,
  moreH: () => <S><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></S>,
};

window.Icons = Icons;

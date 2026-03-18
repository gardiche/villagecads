import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const ECLAIR = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135.3 262.8" fill="currentColor" className="w-full h-full">
    <path d="M46.76,262.49c4.76-36.53,9.52-73.06,14.34-110.09H0C6.19,101.35,12.31,50.85,18.48,0h78.79c-8.86,33.09-17.68,66.04-26.65,99.55h64.68c-29.45,54.94-58.47,109.09-87.5,163.25-.35-.1-.69-.2-1.04-.3Z"/>
  </svg>
);

const ETOILE = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="currentColor" className="w-full h-full">
    <path d="m91.03,89.41c3.97-3.37,7.41-6.3,11.09-9.42-3.66-3.15-7.18-6.19-11.12-9.58,5.2-.36,9.85-.69,14.74-1.03-1.3-4.73-2.52-9.16-3.9-14.2,4.41,2.73,8.35,5.16,12.5,7.73,1.88-4.46,3.66-8.69,5.73-13.59,1.82,4.79,3.4,8.97,5.14,13.55,4.13-2.56,8.09-5.01,12.56-7.78-1.2,4.92-2.29,9.34-3.47,14.19,4.9.32,9.54.62,14.7.95-3.87,3.35-7.36,6.36-11.16,9.64,3.74,2.98,7.37,5.87,10.99,8.76-.06.2-.12.39-.18.59-4.66.22-9.32.44-14.31.68,1.17,4.74,2.3,9.34,3.56,14.47-4.4-2.79-8.36-5.3-12.57-7.96-1.74,4.6-3.42,9.04-5.38,14.24-1.94-5.12-3.62-9.53-5.4-14.21-4.12,2.65-8.07,5.18-12.52,8.05,1.22-5.1,2.33-9.7,3.48-14.5-4.73-.19-9.25-.38-14.5-.59Z"/>
  </svg>
);

const COEUR = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220.49 193.95" fill="currentColor" className="w-full h-full">
    <path d="M110.29,34.07c3.32-4.73,6.07-9.28,9.43-13.34,27.5-33.27,78.32-25.05,95.12,15.43,9.35,22.53,6.8,44.18-5.59,64.97-10.32,17.31-25.04,30.5-39.98,43.51-17.56,15.29-35.1,30.59-52.66,45.88-5.11,4.45-7.54,4.58-12.55.21-22.43-19.56-45.14-38.81-67.06-58.92-14.76-13.53-28.15-28.6-33.78-48.57C-3.84,58.16.37,35.06,19.11,16.34c24.72-24.7,63.39-20.82,84.31,7.72,2.32,3.17,4.45,6.48,6.87,10.02Z"/>
  </svg>
);

const ROUE = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 206.94 207.07" fill="currentColor" className="w-full h-full">
    <path d="M111.17,10.3c1.61,1.66,6.4,1.46,8.53.56,2.99-1.25,1.07-9.87,10.48-7.1,6.5,1.91.9,12.2,7.65,14.34,7.56,2.39,7.68-9.95,16.56-4.64,6.04,3.61-2.93,13.07,4.71,16.28,5.42,2.27,9.47-6.76,15.38-1.95,6.3,5.12-3.9,11.49.22,17.22,4.38,6.11,13.57-5.17,17.13,4.9,2.47,6.99-8.86,7.75-4.17,15.81,2.25,3.53,12.41-1.02,14.61,5.59,2.83,8.52-8.2,6.45-7.49,15.43.61,7.77,14.15,1.36,11.9,13.02-1.12,5.8-11.44,2.82-10.95,10.93.4,6.54,10.44,4.35,9.95,11.97-.58,8.94-11.85,2.66-13.76,9.27-2.5,8.65,10.49,9.35,4.72,17.66-3.46,4.98-13.63-1.96-15.71,5.29-1.77,6.17,6.92,8.13,2.87,14.8-4.29,7.09-13.58-4.29-17.88,3.05-2.93,5,4.75,11.6-1.56,15.4-7.66,4.61-10.58-8.48-17.48-2.51-4.87,4.21,3.31,12.95-6.01,14.97-8.48,1.84-6.47-7.52-12.48-7.45-9.75.11-3.36,11.23-10.43,13.45-9.76,3.06-6.27-9.64-14.51-9.64-8.01,0-4.64,10.87-12.86,10.08s-3.58-9.98-8.28-12.77c-8.95-5.31-7.69,8.97-16.29,6.37-9.15-2.77-.59-11.55-6.56-15.44-6.83-4.46-8.21,5.7-15.4,3.44-9.62-3.02,2.45-13.42-4.38-17.57-5.57-3.38-12.7,5.03-16.58-1.38-4.04-6.67,4.65-8.1,2.63-15.6-1.7-6.32-12.84.96-15.81-5.13-4.51-9.26,7.77-7.79,5.04-17.02-1.89-6.4-10.4-.88-13-6.96-4.23-9.88,10.6-7.24,9.07-15.95-1.27-7.21-12.83-2.65-10.8-13.18,1.35-7,15.07-1.48,11.77-12.78-1.1-3.78-8.79-4.09-7.36-10.69,2.21-10.17,17.43.85,15.33-12.26-.65-4.03-6.89-3.12-4.58-10.98,2.51-8.52,12.73,1.6,16.81-4.13,4.4-6.17-6.81-12.63,1.36-17.59,6.2-3.77,8.61,4.68,14.24,2.32,7.58-3.18-2.13-15.46,6.8-17.21,8.74-1.71,6.81,7.82,14.46,5.56,7.5-2.22.41-13.01,8.49-14.54,9.93-1.88,5.6,9.92,15.91,7.97,4.86-.92,2.31-12.47,10.62-11.48,6.79.81,4.91,8.01,7.07,10.24Z"/>
  </svg>
);

const CROIX = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 233.47 234.66" fill="currentColor" className="w-full h-full">
    <path d="M128.74,0c-1.1,41.62,25.22,80.69,63.16,96.93,13.53,5.79,26.92,7.73,41.52,8.85l.06,22.9c-57.35.2-105.13,47.24-105.18,104.79-.87,1.25-18.47,1.41-21.01.94-1.14-.21-2.02-.34-2.35-1.64-.06-57.05-47.96-103.93-104.88-104.09l-.05-22.37c.19-1.09,17.32-2.34,20.21-2.87C68.67,94.66,105.85,49.28,104.79,0h23.95Z"/>
  </svg>
);

const PIMENT = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.23 14.17" fill="currentColor" className="w-full h-full">
    <path d="m.45,4.13s.31-.36.44-.67c.16-.38.12-.74.09-.97C.81,1.25-.14.68.1.24.18.09.39-.02.57,0c.4.06.56.83,1.3,2.33.11.22.26.51.54.59.08.02.13.04.2.04.12,0,.26-.03.57-.1.44-.1.83.03,1.05.38-.48-.09-.88.03-1.2.37-.25.26-.49.52-.72.79-.12.13-.24.25-.37.34-.23.16-.49.24-.81.15-.18-.05-.33-.07-.47-.02-.11.04-.1.09-.25.16-.09.04-.23.1-.32.04-.11-.07-.09-.29-.08-.31.12-.22.26-.45.44-.63Z"/>
    <path d="m.41,5.44c.25-.15.47.05,1.05,0,.12,0,.23-.03.33-.07.32-.11.57-.34.77-.53.52-.5.48-.77.86-.88.41-.11.64.04.87-.12.12-.08.11-.17.17-.19.16-.05.54.45,1.48,2.6.33.74.92,1.83,1.92,2.91.97,1.05,1.49,1.47,2.24,1.81,2.21,1.02,4.53-.09,5.03.12.02,0,.07.03.09.08.18.38-1.35,1.61-2.88,2.3-.3.13-.98.44-1.85.59-2.66.48-4.94-.77-5.75-1.23C2.15,11.38.63,9.06.24,7.25c-.18-.81-.13-1.63.17-1.81Z"/>
  </svg>
);

const ARROW = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236.32 176.48" fill="currentColor" className="w-full h-full">
    <polygon points="142.58 100.67 142.58 176.48 89.71 176.48 89.71 100.67 40.2 147.48 .96 115.11 0 112.24 119.27 0 236.32 113.14 196.08 150.47 142.58 100.67"/>
  </svg>
);

const tools = [
  {
    id: "ancre",
    name: "Ancre",
    tagline: "Pilotage du fondateur",
    description: "Transformez votre charge mentale en actions quotidiennes claires, alignées sur votre énergie réelle.",
    icon: COEUR,
    iconColor: "#f9b104",
    available: true,
    route: "/landing",
    category: "Pilotage",
  },
  {
    id: "cap",
    name: "Cap",
    tagline: "Alignement & vision",
    description: "Construisez une roadmap à 24 mois que votre équipe comprend et que vos investisseurs respectent.",
    icon: CROIX,
    iconColor: "#f9b104",
    available: false,
    category: "Roadmap",
  },
  {
    id: "runway",
    name: "Runway",
    tagline: "Cashflow & survie",
    description: "Visualisez combien de mois il vous reste, dans le pire comme dans le meilleur scénario.",
    icon: ARROW,
    iconColor: "#f9b104",
    available: true,
    route: "/",
    category: "Finance",
  },
  {
    id: "pitch",
    name: "Pitch",
    tagline: "Investor readiness",
    description: "Mesurez votre maturité à lever avant de décrocher votre premier call investisseur.",
    icon: ECLAIR,
    iconColor: "#f9b104",
    available: false,
    category: "Levée",
  },
  {
    id: "gtm",
    name: "GTM",
    tagline: "Go-to-market builder",
    description: "Posez enfin les bases de votre go-to-market — ICP, canaux, message — sans vous perdre en chemin.",
    icon: ROUE,
    iconColor: "#f9b104",
    available: true,
    route: "/",
    category: "Marché",
  },
  {
    id: "pipeline",
    name: "Pipeline",
    tagline: "Suivi commercial",
    description: "Transformez votre acquisition opportuniste en machine commerciale prévisible et pilotable.",
    icon: PIMENT,
    iconColor: "#f9b104",
    available: false,
    category: "Ventes",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const Hub = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1d1d1b] flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '2px dashed #f9b104' }}>
        <img
          src="/village/LOGO-VBCASavoie_blanc.png"
          alt="Le Village by CA des Savoie"
          className="h-16 object-contain"
        />
        <span className="text-white/30 text-xs font-medium uppercase tracking-widest">
          Vos outils
        </span>
      </header>

      {/* Hero */}
      <div className="px-8 pt-16 pb-10 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[#f9b104] text-xs font-semibold uppercase tracking-widest mb-3">
            Écosystème Village
          </p>
          <h1 className="text-white font-display font-black text-4xl sm:text-5xl md:text-6xl leading-tight">
            Vos outils<br />d'accompagnement.
          </h1>
          <p className="text-white/40 mt-4 text-base max-w-lg">
            Vous avancez vite. Ces outils sont là pour que vous avanciez juste.
          </p>
        </motion.div>
      </div>

      {/* Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="px-8 pb-16 max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {tools.map((tool) => (
          <motion.div key={tool.id} variants={item}>
            <div
              onClick={() => tool.available && navigate(tool.route!)}
              className={`
                group relative overflow-hidden rounded-2xl border p-6 h-64 flex flex-col justify-between
                transition-all duration-300
                ${tool.available
                  ? "border-white/10 bg-white/5 hover:border-[#f9b104] hover:bg-white/8 cursor-pointer"
                  : "border-[#f9b104] bg-[#f9b104] cursor-pointer hover:border-[#1d1d1b] hover:brightness-95"
                }
              `}
            >
              {/* Motif SVG en fond décoratif */}
              <div
                className={`
                  absolute -right-4 -bottom-4 w-24 h-24 transition-all duration-300
                  ${tool.available ? "opacity-10 group-hover:opacity-20 group-hover:scale-110" : "opacity-20 group-hover:opacity-30 group-hover:scale-110"}
                `}
                style={{ color: tool.available ? tool.iconColor : "#1d1d1b" }}
              >
                {tool.icon}
              </div>

              {/* Badge disponibilité */}
              <div className="flex items-start justify-between">
                <div
                  className="w-8 h-8 flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ color: tool.available ? tool.iconColor : "#1d1d1b" }}
                >
                  <div className="w-6 h-6">{tool.icon}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                  tool.available
                    ? "bg-[#f9b104]/15 text-[#f9b104]"
                    : "bg-white/30 text-[#1d1d1b]"
                }`}>
                  {tool.category}
                </span>
              </div>

              {/* Texte */}
              <div>
                <p className={`text-xs uppercase tracking-widest mb-1 ${tool.available ? "text-white/40" : "text-[#1d1d1b]/60"}`}>{tool.tagline}</p>
                <h2 className={`font-display font-black text-2xl leading-none mb-2 ${tool.available ? "text-white" : "text-[#1d1d1b]"}`}>{tool.name}</h2>
                <p className={`text-xs leading-relaxed ${tool.available ? "text-white/40" : "text-[#1d1d1b]/60"}`}>{tool.description}</p>
              </div>

              {/* CTA arrow on hover */}
              <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tool.available ? "bg-[#f9b104]" : "bg-[#1d1d1b]"}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M6 2l4 4-4 4" stroke={tool.available ? "#1d1d1b" : "#f9b104"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer */}
      <div className="mt-auto px-8 py-6 border-t border-white/8 flex items-center justify-between">
        <p className="text-white/20 text-xs">© 2026 Le Village by CA des Savoie</p>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f9b104]" />
          <p className="text-white/20 text-xs">1 outil actif sur 6</p>
        </div>
      </div>

    </div>
  );
};

export default Hub;

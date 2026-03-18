interface CommonFooterProps {
  pageTitle: string;
}

const CommonFooter = ({ pageTitle }: CommonFooterProps) => {
  return (
    <footer className="border-t border-border bg-background/80 backdrop-blur-lg mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo Village */}
          <div className="flex items-center gap-3">
            <img src="/village/LOGO-VBCASavoie_coul.png" alt="Le Village by CA des Savoie" className="h-10 object-contain" />
          </div>

          {/* Footer text */}
          <p className="text-xs text-muted-foreground text-center sm:text-right">
            Outil d'accompagnement entrepreneurial — Village by CA des Savoie
          </p>
        </div>
      </div>
    </footer>
  );
};

export default CommonFooter;

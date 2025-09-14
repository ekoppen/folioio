import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Instagram, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-primary text-primary-foreground">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Contact Info */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-6 text-portfolio-accent">
              Laten we samenwerken
            </h3>
            <p className="text-primary-foreground/80 mb-6 text-lg">
              Heb je een project in gedachten? Ik hoor graag van je! 
              Laat's jouw ideeën samen tot leven brengen.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-portfolio-accent" />
                <a href="mailto:info@portfolio.nl" className="hover:text-portfolio-accent transition-colors">
                  info@portfolio.nl
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-portfolio-accent" />
                <a href="tel:+31612345678" className="hover:text-portfolio-accent transition-colors">
                  +31 6 12 34 56 78
                </a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-portfolio-accent" />
                <span>Amsterdam, Nederland</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="text-primary-foreground/80 hover:text-portfolio-accent transition-colors">Home</a></li>
              <li><a href="#portfolio" className="text-primary-foreground/80 hover:text-portfolio-accent transition-colors">Portfolio</a></li>
              <li><a href="#about" className="text-primary-foreground/80 hover:text-portfolio-accent transition-colors">Over Mij</a></li>
              <li><a href="#contact" className="text-primary-foreground/80 hover:text-portfolio-accent transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Nieuwsbrief</h4>
            <p className="text-primary-foreground/80 mb-4 text-sm">
              Blijf op de hoogte van nieuwe projecten en updates.
            </p>
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="Je email adres" 
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
              />
              <Button size="sm" className="w-full accent-gradient text-primary hover:opacity-90">
                Inschrijven
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-primary-foreground/20" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-primary-foreground/60 text-sm">
            © {currentYear} Portfolio. Alle rechten voorbehouden.
          </div>
          
          {/* Social Media Links */}
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="text-primary-foreground/60 hover:text-portfolio-accent transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-primary-foreground/60 hover:text-portfolio-accent transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-primary-foreground/60 hover:text-portfolio-accent transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
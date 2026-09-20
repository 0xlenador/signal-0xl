import Link from 'next/link';
import Image from 'next/image';
import { EVM_NETWORKS } from '@/lib/config';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const networks = Object.values(EVM_NETWORKS);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
      {/* Hero Header */}
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h1 className="flex items-center justify-center gap-3 md:gap-5 text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
          <Image src="/icon.svg" alt="Signal 0xL Logo" width={80} height={80} className="w-12 h-12 md:w-16 md:h-16" />
          <div>Signal <span className="text-accent-runestone">0xL</span></div>
        </h1>
        <p className="text-muted-foreground text-lg">
          Select a network to connect your wallet and broadcast your signal.
        </p>
      </div>

      {/* Network Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {networks.map((network) => {
          // Si el contractAddress es el "0x00..." significa que aún no está desplegado en mainnet y se muestra deshabilitado
          const isComingSoon = network.contractAddress === '0x0000000000000000000000000000000000000000';

          if (isComingSoon) {
            return (
              <Card key={network.chainId} className="h-full opacity-60 cursor-not-allowed bg-muted/30">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 mb-6 rounded-full overflow-hidden border border-border grayscale">
                    {network.iconUrl && (
                      <Image src={network.iconUrl} alt={network.name} width={80} height={80} className="w-full h-full object-cover opacity-60" />
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2 text-foreground">
                    {network.name}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Main production network. Official deployment.
                  </p>

                  <div className="mt-6">
                    <Badge variant="secondary" className="px-3 py-1 font-medium">
                      Coming Soon
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Link key={network.chainId} href={`/${network.slug}`} className="block transition-transform hover:scale-[1.02]">
              <Card className="h-full hover:border-accent-runestone/50 transition-colors cursor-pointer overflow-hidden relative group">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 mb-6 rounded-full overflow-hidden border border-border shadow-sm group-hover:border-accent-runestone/30 transition-colors">
                    {network.iconUrl && (
                      <Image src={network.iconUrl} alt={network.name} width={80} height={80} className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2 text-foreground group-hover:text-accent-runestone transition-colors">
                    {network.name}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Testing and validation environment. Active network for daily signal broadcasting.
                  </p>

                  <div className="mt-6">
                    <Badge variant="outline" className="gap-2 px-3 py-1 bg-green-50/50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Online
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import Arraia2026Sales from '../components/arraia2026/Arraia2026Sales';
import Arraia2026PreLaunch from '../components/arraia2026/Arraia2026PreLaunch';

// FLAG PARA MODO PRÉ-LANÇAMENTO (TRUE = Oculta Vendas, Mostra Lista VIP 2ª Edição)
const PRE_LAUNCH_MODE = true;

const Arraia2026: React.FC = () => {
    if (PRE_LAUNCH_MODE) {
        return <Arraia2026PreLaunch />;
    }
    
    // Se a flag for false, volta ao modo original com vendas (Mercado Pago, Pix, Lotes)
    return <Arraia2026Sales />;
};

export default Arraia2026;

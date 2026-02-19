
-- Insert default features (Structure)
INSERT INTO public.site_sections (section_key, title, icon, order_index) VALUES
('structure', 'Cozinha Industrial', 'soup_kitchen', 1),
('structure', 'Piscina Aquecida', 'pool', 2),
('structure', 'Área Coberta', 'roofing', 3),
('structure', 'Ampla Área Verde', 'park', 4)
ON CONFLICT DO NOTHING;

-- Insert default gallery images
INSERT INTO public.gallery_images (url, category, caption) VALUES
('https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Casamentos', 'Casamento ao ar livre'),
('https://images.unsplash.com/photo-1519225421980-715cb0202128?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Casamentos', 'Noivos na natureza'),
('https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Festas', 'Festa de aniversário'),
('https://images.unsplash.com/photo-1530103862676-de3c9da59af7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Detalhes', 'Decoração de mesa'),
('https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Corporativo', 'Evento corporativo'),
('https://images.unsplash.com/photo-1478146896981-b80fe463b330?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Detalhes', 'Detalhes da decoração');

-- Insert default testimonials
INSERT INTO public.testimonials (name, role, content, image_url, rating) VALUES
('Ana & Lucas', 'Casamento', 'O lugar é mágico! Exatamente como sonhamos. A equipe foi super atenciosa e o pôr do sol nas fotos ficou incrível. Recomendo de olhos fechados!', 'https://randomuser.me/api/portraits/women/42.jpg', 5),
('Patricia Gomes', 'Aniversário 40 anos', 'Estrutura impecável. A cozinha é ótima para o buffet e os banheiros são super acessíveis e limpos. Meus convidados amaram o espaço.', 'https://randomuser.me/api/portraits/women/68.jpg', 5),
('Empresa TechSolution', 'Confraternização', 'Realizamos nosso evento de fim de ano e foi um sucesso. O ambiente rústico trouxe um clima muito acolhedor que fugiu do padrão corporativo frio.', 'https://randomuser.me/api/portraits/men/32.jpg', 5);

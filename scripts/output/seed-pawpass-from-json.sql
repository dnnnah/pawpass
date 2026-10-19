-- ====================================================================
-- PAWPASS — MIGRACIÓN / SEED DESDE FUENTES JSON (ETL)
-- Generado automáticamente con UUIDs deterministas
-- Compatible con el catálogo PostgreSQL 17 / Supabase
-- ====================================================================

BEGIN;

-- 1. REFUGIOS

INSERT INTO public.shelters (
  id, nombre, slug, descripcion, ubicacion,
  nombre_responsable, telefono, whatsapp, email,
  redes, verificado, publicado, publicar_contacto
) VALUES (
  'f77381be-43a0-56cb-ad1f-d93d33194c91',
  'Patitas con Causa',
  'patitas-con-causa',
  'Refugio de demostración del prototipo de PawPass. Rescata, recupera y promueve la adopción responsable de perros y gatos en la zona de la Ciudad de México.',
  'Colonia Roma Norte, Ciudad de México',
  'Marta Gómez',
  '5550123456',
  '5215550123456',
  'adopciones@patitasconcausa.mx',
  '{"https://facebook.com/patitasconcausa","https://instagram.com/patitas.con.causa"}'::text[],
  true,
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  ubicacion = EXCLUDED.ubicacion,
  nombre_responsable = EXCLUDED.nombre_responsable,
  telefono = EXCLUDED.telefono,
  whatsapp = EXCLUDED.whatsapp,
  email = EXCLUDED.email,
  redes = EXCLUDED.redes,
  verificado = EXCLUDED.verificado,
  publicado = EXCLUDED.publicado,
  publicar_contacto = EXCLUDED.publicar_contacto;


INSERT INTO public.shelters (
  id, nombre, slug, descripcion, ubicacion,
  nombre_responsable, telefono, whatsapp, email,
  redes, verificado, publicado, publicar_contacto
) VALUES (
  '341e9ca1-e0c0-5e1b-ac6e-e9340c2e4d85',
  'Rincón Canino Ixtapaluca',
  'rincon-canino',
  'Espacio de demostración del prototipo de PawPass dedicado al rescate canino en el oriente del Estado de México.',
  'Ixtapaluca, Estado de México',
  'Luis Hernández',
  '5550987654',
  '5215550987654',
  NULL,
  '{}'::text[],
  false,
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  ubicacion = EXCLUDED.ubicacion,
  nombre_responsable = EXCLUDED.nombre_responsable,
  telefono = EXCLUDED.telefono,
  whatsapp = EXCLUDED.whatsapp,
  email = EXCLUDED.email,
  redes = EXCLUDED.redes,
  verificado = EXCLUDED.verificado,
  publicado = EXCLUDED.publicado,
  publicar_contacto = EXCLUDED.publicar_contacto;

-- 2. MASCOTAS Y SUB-ENTIDADES

-- Mascota: Lucca (PC-LUCCA-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  'PC-LUCCA-001',
  'Lucca',
  'perro',
  'en_casa',
  '2023-01-07',
  'lucca',
  'Schnauzer miniatura',
  'macho',
  'miniatura',
  'Sal con pimienta',
  7,
  false,
  '{"Tiene los bigotes dorados","Las orejas siempre están levantadas"}'::text[],
  NULL,
  'No cuenta con rastreador GPS ni microchip.',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  'Donnovan Trejo',
  '5646091856',
  '5646091856',
  NULL,
  NULL,
  'cerca de casa',
  'San Buenaventura, Ixtapaluca',
  'Hola, encontré a Lucca. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Amigable y curioso, puede asustarse con ruidos fuertes.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  'Veterinaria Alux',
  'Alux veterinaria',
  '5534487768',
  'Roma Norte, CDMX',
  'L-S 10am a 7pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  'a7900d1d-5ccd-5c35-9e7f-c42ea80692d7',
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  'Rabia',
  '2025-01-15',
  '2026-01-15',
  'A123',
  'Dr. López',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '3bec4a7f-062c-5369-bf31-dad83096feee',
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  'Parvovirus',
  '2025-02-20',
  '2026-02-20',
  'P456',
  'Dr. López',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '539d3820-c35f-570d-a37e-d48b5c94f204',
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  'Triple Canina',
  '2025-01-15',
  '2026-01-15',
  'TC789',
  'Dr. López',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '2a840f77-074f-5941-8ea1-3552dbde8db8',
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  'Cartilla de Vacunación',
  'vacunas',
  'pdf',
  'pawpass-documentos',
  '2a840f77-074f-5941-8ea1-3552dbde8db8/cartilla-vacunacion.pdf',
  'application/pdf',
  2516582,
  '2025-01-15',
  'Cartilla pública con vacunas al día.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'ea6166d9-f91c-553f-a530-17a2e6e22fba',
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  'Comprobante Veterinario',
  'veterinario',
  'pdf',
  'pawpass-documentos',
  'ea6166d9-f91c-553f-a530-17a2e6e22fba/comprobante-veterinario.pdf',
  'application/pdf',
  1153434,
  '2025-02-20',
  'Comprobante de última consulta.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'c700d2d3-f3d0-5cc8-a4c3-1fbf4c3150c1',
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  'Foto Reciente',
  'foto',
  'imagen',
  'pawpass-fotos',
  'c700d2d3-f3d0-5cc8-a4c3-1fbf4c3150c1/foto-reciente.jpg',
  'image/jpeg',
  634880,
  '2025-03-12',
  'Imagen reciente para identificarlo rápido.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'f639cc73-d9c4-5a03-8761-c910dc0ed69f',
  '9ffef61d-d7a0-5844-875e-0ddaa550fe68',
  'Estudios Médicos',
  'salud',
  'pdf',
  'pawpass-documentos',
  'f639cc73-d9c4-5a03-8761-c910dc0ed69f/estudios-medicos.pdf',
  'application/pdf',
  3355443,
  '2025-03-12',
  'Resultados médicos privados.',
  false
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Niko (PC-NIKO-002)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  'PC-NIKO-002',
  'Niko',
  'perro',
  'en_casa',
  '2022-11-27',
  'niko',
  'Mestizo',
  'macho',
  'mediano',
  'Blanco con negro',
  12,
  false,
  '{"Tiene manchas negras en su cuerpo, parece domino","Chimuelo"}'::text[],
  NULL,
  '',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  'Evelia Corona',
  '5522576308',
  '5522576308',
  NULL,
  NULL,
  'cerca de casa',
  'Nezahualcoyolt, EDOMEX',
  'Hola, encontré a Niko. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Muy sociable, muy noble, se emociona al ver pelotas.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  'Clínica Canina Condesa',
  'Dra. Méndez',
  '5555667788',
  'Condesa, CDMX',
  'Lun-Vie 10:00 a 19:00'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '115ff41d-4c84-5591-878b-984ac3228832',
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  'Rabia',
  '2025-03-08',
  '2026-03-08',
  'R204',
  'Dra. Méndez',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  'e86f4f34-88be-59f1-875e-d4531b64fad1',
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  'Bordetella',
  '2025-04-14',
  '2026-04-14',
  'B118',
  'Dra. Méndez',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '8abd11cd-2d6e-5ff8-9dbb-583743987ca5',
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  'Múltiple Canina',
  '2025-03-08',
  '2026-03-08',
  'MC302',
  'Dra. Méndez',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '02091c52-b49e-5125-9e81-25440dac2132',
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  'Cartilla de Vacunación',
  'vacunas',
  'pdf',
  'pawpass-documentos',
  '02091c52-b49e-5125-9e81-25440dac2132/cartilla-vacunacion.pdf',
  'application/pdf',
  2202010,
  '2025-03-08',
  'Cartilla pública con su esquema de vacunación.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'c13fe4a0-996d-5b99-83be-73720c98ce30',
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  'Registro Microchip',
  'identificacion',
  'pdf',
  'pawpass-documentos',
  'c13fe4a0-996d-5b99-83be-73720c98ce30/comprobante-veterinario.pdf',
  'application/pdf',
  870400,
  '2025-03-10',
  'Registro de identificación y datos de contacto.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'df68c8e9-264d-5650-9593-cf58a06b08e5',
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  'Foto Reciente',
  'foto',
  'imagen',
  'pawpass-fotos',
  'df68c8e9-264d-5650-9593-cf58a06b08e5/foto-reciente.jpg',
  'image/jpeg',
  716800,
  '2025-04-01',
  'Foto reciente para reconocerlo al instante.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '5c9a0f74-e04d-526a-b356-1660962807a8',
  'e1e25d19-bfa3-54af-93a0-32a121de7d9d',
  'Plan Nutricional',
  'salud',
  'pdf',
  'pawpass-documentos',
  '5c9a0f74-e04d-526a-b356-1660962807a8/estudios-medicos.pdf',
  'application/pdf',
  1468006,
  '2025-04-01',
  'Notas privadas sobre dieta y salud.',
  false
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Alix (PC-ALIX-003)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  'PC-ALIX-003',
  'Alix',
  'perro',
  'en_casa',
  '2023-11-02',
  'alix',
  'Criollo',
  'hembra',
  'pequeno',
  'Blanco con café',
  10,
  false,
  '{"Manchita café sobre el ojo derecho","Cola muy esponjada"}'::text[],
  NULL,
  'Usa placa con QR temporal.',
  false
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  'Familia de Alix',
  '5534567890',
  '5215534567890',
  NULL,
  NULL,
  'cerca de su edificio',
  'Del Valle, CDMX',
  'Hola, encontré a Alix. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  '{}'::text[],
  '{"Ansiedad con fuegos artificiales"}'::text[],
  '{}'::text[],
  NULL,
  'Cariñosa, tímida con personas nuevas.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  'Vet Del Valle',
  'Dr. Salas',
  '5566778899',
  'Del Valle, CDMX',
  'Lun-Sáb 8:00 a 17:00'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '00fe13d6-f535-57e8-8159-43afa9fb20ec',
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  'Rabia',
  '2025-06-02',
  '2026-06-02',
  'R901',
  'Dr. Salas',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '22ab64c7-02c3-51dd-8dd8-3b45c7d9f9e8',
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  'Parvovirus',
  '2025-06-02',
  '2026-06-02',
  'P902',
  'Dr. Salas',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '675fc454-ff57-586f-b3c2-a272832db70d',
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  'Múltiple Canina',
  '2025-06-02',
  '2026-06-02',
  'MC903',
  'Dr. Salas',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'c636b71b-fc7a-5ad5-b8df-dad6158d013c',
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  'Cartilla de Vacunación',
  'vacunas',
  'pdf',
  'pawpass-documentos',
  'c636b71b-fc7a-5ad5-b8df-dad6158d013c/cartilla-vacunacion.pdf',
  'application/pdf',
  1887437,
  '2025-06-02',
  'Cartilla pública con vacunas al día.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'eba80468-2494-5787-9ea9-ae5b6ef34538',
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  'Comprobante Veterinario',
  'veterinario',
  'pdf',
  'pawpass-documentos',
  'eba80468-2494-5787-9ea9-ae5b6ef34538/comprobante-veterinario.pdf',
  'application/pdf',
  921600,
  '2025-06-02',
  'Comprobante de consulta y revisión.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'f4c7de54-99dd-5ca5-94ef-0cbd49d09928',
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  'Foto Reciente',
  'foto',
  'imagen',
  'pawpass-fotos',
  'f4c7de54-99dd-5ca5-94ef-0cbd49d09928/foto-reciente.jpg',
  'image/jpeg',
  737280,
  '2025-06-10',
  'Foto reciente para reconocerla mejor.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '03b4ff9b-c7b8-5b23-b1aa-d6211a0c9f23',
  'd59b3e00-0c67-557e-bd78-0f4a0c8f5438',
  'Notas de Conducta',
  'salud',
  'pdf',
  'pawpass-documentos',
  '03b4ff9b-c7b8-5b23-b1aa-d6211a0c9f23/estudios-medicos.pdf',
  'application/pdf',
  737280,
  '2025-06-10',
  'Notas privadas sobre comportamiento.',
  false
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Loki (PC-LOKI-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  'c31beaff-d103-5d84-8951-548e31e128ab',
  'PC-LOKI-001',
  'Loki',
  'gato',
  'en_casa',
  '2021-08-01',
  'loki',
  'Mestizo',
  'macho',
  'grande',
  'Gris',
  3,
  true,
  '{"Una oreja izquierda mocha","Nariz café","Pelo de la panza rizado"}'::text[],
  NULL,
  'No cuenta con rastreador GPS ni microchip.',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  'c31beaff-d103-5d84-8951-548e31e128ab',
  'Ana Karen',
  '552201296480',
  '552201296480',
  NULL,
  NULL,
  'cerca de su casa',
  'San Isidro, EDOMEX',
  'Hola, encontré a Loki. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  'c31beaff-d103-5d84-8951-548e31e128ab',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  'c31beaff-d103-5d84-8951-548e31e128ab',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Amigable y tímido'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  'c31beaff-d103-5d84-8951-548e31e128ab',
  'JADIPS Vet',
  'JADIPS Vet',
  '5522759041',
  'Aries y San Vicente, San Isidro, 56516',
  '10am a 8pm L-V'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '152984f0-1895-5d13-9084-880579471bbb',
  'c31beaff-d103-5d84-8951-548e31e128ab',
  'Cartilla de Vacunación',
  'vacunas',
  'pdf',
  'pawpass-documentos',
  '152984f0-1895-5d13-9084-880579471bbb/cartilla-vacunacion.pdf',
  'application/pdf',
  1992294,
  '2025-05-05',
  'Cartilla pública con su historial de vacunación.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'b4131f14-2a57-5d70-a8c2-a431583a08f1',
  'c31beaff-d103-5d84-8951-548e31e128ab',
  'Registro Microchip',
  'identificacion',
  'pdf',
  'pawpass-documentos',
  'b4131f14-2a57-5d70-a8c2-a431583a08f1/comprobante-veterinario.pdf',
  'application/pdf',
  839680,
  '2025-05-06',
  'Registro público de identificación.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '5fe543eb-2f38-5528-9d70-879962bcc028',
  'c31beaff-d103-5d84-8951-548e31e128ab',
  'Foto Reciente',
  'foto',
  'imagen',
  'pawpass-fotos',
  '5fe543eb-2f38-5528-9d70-879962bcc028/foto-reciente.jpg',
  'image/jpeg',
  655360,
  '2025-05-18',
  'Foto reciente de Loki.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '3291b493-b59e-5821-8cd2-dfba77527743',
  'c31beaff-d103-5d84-8951-548e31e128ab',
  'Revisión General',
  'salud',
  'pdf',
  'pawpass-documentos',
  '3291b493-b59e-5821-8cd2-dfba77527743/estudios-medicos.pdf',
  'application/pdf',
  1258291,
  '2025-05-18',
  'Revisión médica privada.',
  false
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Viserys (PC-VISERYS-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '1592bc6d-d5b4-58e9-8931-97a678a48066',
  'PC-VISERYS-001',
  'Viserys',
  'gato',
  'en_casa',
  '2024-10-01',
  'viserys',
  'Mestizo',
  'macho',
  'grande',
  'Blanco',
  3,
  true,
  '{"Manchas negras con rayas en espalda","Manchas en patas y dedos"}'::text[],
  NULL,
  '',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '1592bc6d-d5b4-58e9-8931-97a678a48066',
  'Ana Karen',
  '552201296480',
  '552201296480',
  NULL,
  NULL,
  'cerca de su casa',
  'San Isidro, EDOMEX',
  'Hola, encontré a Viserys. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '1592bc6d-d5b4-58e9-8931-97a678a48066',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '1592bc6d-d5b4-58e9-8931-97a678a48066',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Amigable y ruidoso'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '1592bc6d-d5b4-58e9-8931-97a678a48066',
  'JADIPS Vet',
  'JADIPS Vet',
  '5522759041',
  'Aries y San Vicente, San Isidro, 56516',
  '10am a 8pm L-V'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'a6e4d6c7-e243-5860-a8e1-aa34b5377a03',
  '1592bc6d-d5b4-58e9-8931-97a678a48066',
  'Cartilla de Vacunación',
  'vacunas',
  'pdf',
  'pawpass-documentos',
  'a6e4d6c7-e243-5860-a8e1-aa34b5377a03/cartilla-vacunacion.pdf',
  'application/pdf',
  2097152,
  '2025-02-11',
  'Cartilla pública con vacunas al día.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '003e8da3-26a0-50c1-8eb3-40b3cbd82cac',
  '1592bc6d-d5b4-58e9-8931-97a678a48066',
  'Comprobante Veterinario',
  'veterinario',
  'pdf',
  'pawpass-documentos',
  '003e8da3-26a0-50c1-8eb3-40b3cbd82cac/comprobante-veterinario.pdf',
  'application/pdf',
  1048576,
  '2025-04-16',
  'Consulta felina y evaluación general.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '460d9a12-e634-59d6-8f40-e4f602941e85',
  '1592bc6d-d5b4-58e9-8931-97a678a48066',
  'Foto Reciente',
  'foto',
  'imagen',
  'pawpass-fotos',
  '460d9a12-e634-59d6-8f40-e4f602941e85/foto-reciente.jpg',
  'image/jpeg',
  696320,
  '2025-04-16',
  'Foto reciente para reconocer su pelaje.',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '4b6e2eb5-66c5-5672-a992-39d64a54e18b',
  '1592bc6d-d5b4-58e9-8931-97a678a48066',
  'Estudio Urinario',
  'salud',
  'pdf',
  'pawpass-documentos',
  '4b6e2eb5-66c5-5672-a992-39d64a54e18b/estudios-medicos.pdf',
  'application/pdf',
  1782579,
  '2025-05-20',
  'Estudio médico privado.',
  false
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Frey (PC-FREY-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '16f9a136-97e5-5c0c-afd6-3f2f0dfd07e3',
  'PC-FREY-001',
  'Frey',
  'gato',
  'en_casa',
  '2024-10-01',
  'frey',
  'Mestizo',
  'macho',
  'grande',
  'Blanco',
  3,
  true,
  '{"Manchas negras con rayas en espalda","Manchas en patas y dedos"}'::text[],
  NULL,
  '',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '16f9a136-97e5-5c0c-afd6-3f2f0dfd07e3',
  'Ana Karen',
  '552201296480',
  '552201296480',
  NULL,
  NULL,
  'cerca de su casa',
  'San Isidro, EDOMEX',
  'Hola, encontré a Frey. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '16f9a136-97e5-5c0c-afd6-3f2f0dfd07e3',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '16f9a136-97e5-5c0c-afd6-3f2f0dfd07e3',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Amigable y ruidoso'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '16f9a136-97e5-5c0c-afd6-3f2f0dfd07e3',
  'JADIPS Vet',
  'JADIPS Vet',
  '5522759041',
  'Aries y San Vicente, San Isidro, 56516',
  '10am a 8pm L-V'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


-- Mascota: Sandor (PC-SANDOR-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '52e401e5-aa48-5049-ae32-ddeda0eb041d',
  'PC-SANDOR-001',
  'Sandor',
  'gato',
  'en_casa',
  '2024-12-01',
  'sandor',
  'Mestizo',
  'macho',
  'mediano',
  'Negro',
  2,
  true,
  '{"Pelaje negro con rayos blancos","No es muy peludo"}'::text[],
  NULL,
  '',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '52e401e5-aa48-5049-ae32-ddeda0eb041d',
  'Ana Karen',
  '552201296480',
  '552201296480',
  NULL,
  NULL,
  'cerca de su casa',
  'San Isidro, EDOMEX',
  'Hola, encontré a Sandor. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '52e401e5-aa48-5049-ae32-ddeda0eb041d',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '52e401e5-aa48-5049-ae32-ddeda0eb041d',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Tímido y se asusta con los ruidos o movimientos bruscos'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '52e401e5-aa48-5049-ae32-ddeda0eb041d',
  'JADIPS Vet',
  'JADIPS Vet',
  '5522759041',
  'Aries y San Vicente, San Isidro, 56516',
  '10am a 8pm L-V'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


-- Mascota: Bizcocho (PC-BIZCOCHO-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '06497fc6-a074-562d-93b4-6b2ce42fde93',
  'PC-BIZCOCHO-001',
  'Bizcocho',
  'gato',
  'en_casa',
  '2021-03-01',
  'bizcocho',
  'Mestizo',
  'macho',
  'grande',
  'Blanco',
  3,
  true,
  '{"Muy peludo","Mancha café claro en cabeza","Ojos azules","Estrabismo ligero"}'::text[],
  NULL,
  '',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '06497fc6-a074-562d-93b4-6b2ce42fde93',
  'Ana Karen',
  '552201296480',
  '552201296480',
  NULL,
  NULL,
  'cerca de su casa',
  'San Isidro, EDOMEX',
  'Hola, encontré a Bizcocho. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '06497fc6-a074-562d-93b4-6b2ce42fde93',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '06497fc6-a074-562d-93b4-6b2ce42fde93',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Tímido y se asusta con los ruidos o movimientos bruscos'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '06497fc6-a074-562d-93b4-6b2ce42fde93',
  'JADIPS Vet',
  'JADIPS Vet',
  '5522759041',
  'Aries y San Vicente, San Isidro, 56516',
  '10am a 8pm L-V'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


-- Mascota: Chicharrona (PC-CHICHARRONA-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  'f5ac8f20-4e08-58af-a9b4-93a03235c632',
  'PC-CHICHARRONA-001',
  'Chicharrona',
  'gato',
  'en_casa',
  '2025-07-01',
  'chicharrona',
  'Mestizo',
  'hembra',
  'pequeno',
  'Negro',
  1,
  true,
  '{"Ojos verdes grandes","Poco pelo"}'::text[],
  NULL,
  '',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  'f5ac8f20-4e08-58af-a9b4-93a03235c632',
  'Ana Karen',
  '552201296480',
  '552201296480',
  NULL,
  NULL,
  'cerca de su casa',
  'San Isidro, EDOMEX',
  'Hola, encontré a Chicharrona. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  'f5ac8f20-4e08-58af-a9b4-93a03235c632',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  'f5ac8f20-4e08-58af-a9b4-93a03235c632',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Amigable pero se asusta con los ruidos o movimientos bruscos'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  'f5ac8f20-4e08-58af-a9b4-93a03235c632',
  'JADIPS Vet',
  'JADIPS Vet',
  '5522759041',
  'Aries y San Vicente, San Isidro, 56516',
  '10am a 8pm L-V'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


-- Mascota: Freya (PC-FREYA-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '0bcbd5a8-d5d2-5c64-80b7-a968a86b34a1',
  'PC-FREYA-001',
  'Freya',
  'gato',
  'en_casa',
  '2025-07-01',
  'freya',
  'Mestizo',
  'hembra',
  'pequeno',
  'Negro',
  1,
  true,
  '{"Ojos verdes grandes","Poco pelo"}'::text[],
  NULL,
  '',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '0bcbd5a8-d5d2-5c64-80b7-a968a86b34a1',
  'Ana Karen',
  '552201296480',
  '552201296480',
  NULL,
  NULL,
  'cerca de su casa',
  'San Isidro, EDOMEX',
  'Hola, encontré a Freya. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '0bcbd5a8-d5d2-5c64-80b7-a968a86b34a1',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '0bcbd5a8-d5d2-5c64-80b7-a968a86b34a1',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Amigable pero se asusta con los ruidos o movimientos bruscos'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '0bcbd5a8-d5d2-5c64-80b7-a968a86b34a1',
  'JADIPS Vet',
  'JADIPS Vet',
  '5522759041',
  'Aries y San Vicente, San Isidro, 56516',
  '10am a 8pm L-V'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


-- Mascota: Arya (PC-ARYA-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '61b8022c-fffa-5538-a24c-0c706f015797',
  'PC-ARYA-001',
  'Arya',
  'gato',
  'en_casa',
  '2022-07-01',
  'arya',
  'Mestizo (Carey)',
  'hembra',
  'mediano',
  'Gris',
  2,
  true,
  '{"Ojos verdes grandes","Poco pelo","Manchas color durazno"}'::text[],
  NULL,
  '',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '61b8022c-fffa-5538-a24c-0c706f015797',
  'Ana Karen',
  '552201296480',
  '552201296480',
  NULL,
  NULL,
  'cerca de su casa',
  'San Isidro, EDOMEX',
  'Hola, encontré a Arya. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '61b8022c-fffa-5538-a24c-0c706f015797',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '61b8022c-fffa-5538-a24c-0c706f015797',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'No es amigable, se asusta con los ruidos o movimientos bruscos, tímida'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '61b8022c-fffa-5538-a24c-0c706f015797',
  'JADIPS Vet',
  'JADIPS Vet',
  '5522759041',
  'Aries y San Vicente, San Isidro, 56516',
  '10am a 8pm L-V'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


-- Mascota: Mila (PC-MILA-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'PC-MILA-001',
  'Mila',
  'perro',
  'en_adopcion',
  '2021-03-15',
  'mila',
  'Mestizo',
  'hembra',
  'mediano',
  'Café con blanco',
  14,
  true,
  '{"Mancha blanca en el pecho","Orejas medio caídas"}'::text[],
  '900123456789012',
  'Mascota de demostración del prototipo de adopción de PawPass.',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'Patitas con Causa',
  '5550123456',
  '5215550123456',
  NULL,
  'adopciones@patitasconcausa.mx',
  'Roma Norte',
  'Colonia Roma Norte, Ciudad de México',
  'Hola, me interesa adoptar a Mila. Vi su perfil en PawPass.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  false,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  'Alimento balanceado, 2 raciones al día',
  'Tranquila y juguetona, se lleva bien con otros perros.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'Clínica Patitas',
  'Clínica Patitas',
  '5550123456',
  'Roma Norte, CDMX',
  'L-S 9am a 6pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '0bfc1871-8cf0-5b45-bd2c-8ae0f0c49a44',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'Rabia',
  '2026-01-20',
  '2027-01-20',
  'A901',
  'Dr. López',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '24b782ed-5fb0-5fb1-b2da-01223085d807',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'Octuple',
  '2026-02-10',
  '2027-02-10',
  'O222',
  'Dr. López',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  'b35d5433-a72f-580f-8497-f90d1554260d',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'Moquillo',
  '2024-01-10',
  '2025-01-10',
  'M110',
  'Dr. López',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_dewormings (
  id, pet_id, producto, fecha, proxima_fecha, dosis, veterinario, visible_publico
) VALUES (
  '9e19bf79-4ab9-51e1-a63a-082c1894b510',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'Praziquantel',
  '2026-03-14',
  '2026-09-14',
  '1 tableta',
  'Dr. López',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_dewormings (
  id, pet_id, producto, fecha, proxima_fecha, dosis, veterinario, visible_publico
) VALUES (
  'e86fd533-4302-505f-9023-2ee9ff186871',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'Fenbendazol',
  '2026-09-15',
  '2027-03-15',
  '2 ml',
  'Dr. López',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_consultations (
  id, pet_id, fecha, motivo, diagnostico, tratamiento, medicamentos, veterinario, visible_publico
) VALUES (
  '74520938-0456-5100-ac33-a0aad3fb6029',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  '2026-01-18',
  'Chequeo anual',
  'Sin hallazgos relevantes',
  'Refuerzo del esquema de vacunación',
  '{"Desparasitante oral"}'::text[],
  'Dr. López',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_consultations (
  id, pet_id, fecha, motivo, diagnostico, tratamiento, medicamentos, veterinario, visible_publico
) VALUES (
  '51714773-2418-5439-abe4-dfd74cf5eecc',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  '2026-03-14',
  'Evaluación digestiva',
  'GIADA',
  'Control de parásitos y dieta ligera',
  '{"Praziquantel"}'::text[],
  'Dr. López',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'cdd7f864-96b3-575d-872a-1e5f0ee38bc4',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'Cartilla de vacunación',
  'vacunas',
  'pdf',
  'pawpass-documentos',
  'cdd7f864-96b3-575d-872a-1e5f0ee38bc4/cartilla-vacunacion.pdf',
  'application/pdf',
  1048576,
  '2026-01-20',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '6cd1c893-f1a7-5cc0-82c5-77cd3242c27c',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'Comprobante veterinario',
  'veterinario',
  'pdf',
  'pawpass-documentos',
  '6cd1c893-f1a7-5cc0-82c5-77cd3242c27c/comprobante-veterinario.pdf',
  'application/pdf',
  1048576,
  '2026-01-18',
  NULL,
  false
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '115d18af-c1ef-597d-b692-7ee520aeadf7',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'Estudios médicos',
  'salud',
  'pdf',
  'pawpass-documentos',
  '115d18af-c1ef-597d-b692-7ee520aeadf7/estudios-medicos.pdf',
  'application/pdf',
  1048576,
  '2026-03-14',
  NULL,
  false
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Toby (PC-TOBY-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  'd0d78e2c-1812-59b3-a239-1bcc20897602',
  'PC-TOBY-001',
  'Toby',
  'perro',
  'en_adopcion',
  '2022-08-02',
  'toby',
  'Beagle',
  'macho',
  'mediano',
  'Tricolor',
  11,
  true,
  '{"Mancha blanca en la frente","Cola con punta blanca"}'::text[],
  NULL,
  'Mascota de demostración del prototipo de adopción de PawPass.',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  'd0d78e2c-1812-59b3-a239-1bcc20897602',
  'Patitas con Causa',
  '5550123456',
  '5215550123456',
  NULL,
  'adopciones@patitasconcausa.mx',
  'Roma Norte',
  'Colonia Roma Norte, Ciudad de México',
  'Hola, me interesa adoptar a Toby. Vi su perfil en PawPass.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  'd0d78e2c-1812-59b3-a239-1bcc20897602',
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  false,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  'd0d78e2c-1812-59b3-a239-1bcc20897602',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Muy activo y curioso, disfruta los paseos largos.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  'd0d78e2c-1812-59b3-a239-1bcc20897602',
  'Clínica Patitas',
  'Clínica Patitas',
  '5550123456',
  'Roma Norte, CDMX',
  'L-S 9am a 6pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  'b4d2630b-7885-52b1-a927-194bf53f5b4d',
  'd0d78e2c-1812-59b3-a239-1bcc20897602',
  'Rabia',
  '2026-01-05',
  '2027-01-05',
  'A842',
  'Dr. López',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Luna (PC-LUNA-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '6b638092-4493-59b3-b001-7c6b1ad5c207',
  'PC-LUNA-001',
  'Luna',
  'perro',
  'en_adopcion',
  '2020-11-30',
  'luna',
  'Mestizo',
  'hembra',
  'mediano',
  'Negro',
  16,
  true,
  '{"Pelo negro brillante"}'::text[],
  NULL,
  'Mascota de demostración del prototipo de adopción de PawPass.',
  false
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '6b638092-4493-59b3-b001-7c6b1ad5c207',
  'Rincón Canino Ixtapaluca',
  '5550987654',
  '5215550987654',
  NULL,
  NULL,
  'Ixtapaluca Centro',
  'Ixtapaluca, Estado de México',
  'Hola, me interesa adoptar a Luna. Vi su perfil en PawPass.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '6b638092-4493-59b3-b001-7c6b1ad5c207',
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  false,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '6b638092-4493-59b3-b001-7c6b1ad5c207',
  '{}'::text[],
  '{"Cicatriz en la pata trasera izquierda"}'::text[],
  '{}'::text[],
  NULL,
  'Cariñosa aunque un poco tímida al principio.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '6b638092-4493-59b3-b001-7c6b1ad5c207',
  'Veterinaria Rincón',
  'Vet Rincón',
  '5550987654',
  'Ixtapaluca, EDOMEX',
  'L-S 10am a 7pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '83291c62-a6f1-5c95-830b-a9a07d2f7045',
  '6b638092-4493-59b3-b001-7c6b1ad5c207',
  'Rabia',
  '2026-03-02',
  '2027-03-02',
  NULL,
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '1dcb450c-0f22-56e6-a157-1d53e22abd19',
  '6b638092-4493-59b3-b001-7c6b1ad5c207',
  'Leptospira',
  '2024-05-10',
  '2025-05-10',
  'L007',
  'Dr. Pacheco',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_dewormings (
  id, pet_id, producto, fecha, proxima_fecha, dosis, veterinario, visible_publico
) VALUES (
  'd1c6a11c-3a06-5b09-8b47-532fc29e6358',
  '6b638092-4493-59b3-b001-7c6b1ad5c207',
  'Pirantel',
  '2026-06-20',
  NULL,
  NULL,
  'Dr. Pacheco',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_consultations (
  id, pet_id, fecha, motivo, diagnostico, tratamiento, medicamentos, veterinario, visible_publico
) VALUES (
  '234c7b11-937a-5909-aae4-d6983e5ed712',
  '6b638092-4493-59b3-b001-7c6b1ad5c207',
  '2026-08-05',
  'Revisión por herida',
  'Cicatriz en pata trasera izquierda en proceso',
  NULL,
  '{}'::text[],
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;


-- Mascota: Simba (PC-SIMBA-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '06c72946-0b5b-5dfd-b3c8-e916803adcbc',
  'PC-SIMBA-001',
  'Simba',
  'gato',
  'en_adopcion',
  '2023-05-18',
  'simba',
  'Mestizo',
  'macho',
  'mediano',
  'Naranja atigrado',
  5,
  true,
  '{"Bigotes blancos","Ojos ámbar"}'::text[],
  NULL,
  'Mascota de demostración del prototipo de adopción de PawPass.',
  false
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '06c72946-0b5b-5dfd-b3c8-e916803adcbc',
  'Rincón Canino Ixtapaluca',
  '5550987654',
  '5215550987654',
  NULL,
  NULL,
  'Ixtapaluca Centro',
  'Ixtapaluca, Estado de México',
  'Hola, me interesa adoptar a Simba. Vi su perfil en PawPass.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '06c72946-0b5b-5dfd-b3c8-e916803adcbc',
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  false,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '06c72946-0b5b-5dfd-b3c8-e916803adcbc',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Juguetón y muy social con humanos.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '06c72946-0b5b-5dfd-b3c8-e916803adcbc',
  'Veterinaria Rincón',
  'Vet Rincón',
  '5550987654',
  'Ixtapaluca, EDOMEX',
  'L-S 10am a 7pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '3eadf118-c5a8-5550-a449-ee2b7199120a',
  '06c72946-0b5b-5dfd-b3c8-e916803adcbc',
  'Triple Felina',
  '2026-02-14',
  '2027-02-14',
  'TF77',
  'Dr. Pacheco',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Rocky (PC-ROCKY-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  'PC-ROCKY-001',
  'Rocky',
  'perro',
  'en_adopcion',
  '2021-10-09',
  'rocky',
  'Bulldog Francés',
  'macho',
  'pequeno',
  'Atigrado',
  10,
  true,
  '{"Máscara oscura en la cara"}'::text[],
  '900987654321098',
  'Mascota de demostración del prototipo de adopción de PawPass.',
  false
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  'Rosa Martínez',
  '5544332211',
  '5215544332211',
  NULL,
  NULL,
  'Nápoles',
  'Colonia Nápoles, Ciudad de México',
  'Hola, me interesa adoptar a Rocky. Vi su perfil en PawPass.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  false,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  '{"Sensible a ciertos piensos"}'::text[],
  '{}'::text[],
  '{}'::text[],
  'Pienso hipoalergénico',
  'Tranquilo y hogareño, ideal para departamentos.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  'Veterinaria La Nápoles',
  'Vet Colonia',
  '5544332211',
  'Nápoles, CDMX',
  'L-D 9am a 8pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  'ab1dd4ef-22f3-51dd-89d5-536fe31d7aee',
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  'Rabia',
  '2026-01-28',
  '2027-01-28',
  'A118',
  'Dr. Soto',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '3de940f1-4f02-5209-b78b-c7fad2a90150',
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  'Poli',
  '2026-03-11',
  '2027-03-11',
  'P530',
  'Dr. Soto',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '2b13f05a-5df0-5516-8ef7-e6015e2b75e0',
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  'Bordetella',
  '2026-08-20',
  '2027-08-20',
  'B456',
  'Dr. Soto',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_dewormings (
  id, pet_id, producto, fecha, proxima_fecha, dosis, veterinario, visible_publico
) VALUES (
  '7bf52aff-9d70-59f0-98eb-277151e8a548',
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  'Pipeta antipulgas y garrapatas',
  '2026-07-10',
  '2026-10-10',
  '1 pipeta',
  'Dr. Soto',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_consultations (
  id, pet_id, fecha, motivo, diagnostico, tratamiento, medicamentos, veterinario, visible_publico
) VALUES (
  'cacafe25-dd1c-5a83-a452-354198fd316c',
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  '2026-07-05',
  'Consulta dermatológica',
  'Dermatitis leve por alergia alimentaria',
  'Cambio de dieta a pienso hipoalergénico',
  '{"Antihistamínico oral"}'::text[],
  'Dr. Soto',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '16fcdb79-ab4a-5787-9214-b6ca269526da',
  '1a70a1bb-ff29-5fda-8590-543a539b08c2',
  'Cartilla de vacunación',
  'vacunas',
  'pdf',
  'pawpass-documentos',
  '16fcdb79-ab4a-5787-9214-b6ca269526da/cartilla-vacunacion.pdf',
  'application/pdf',
  1048576,
  '2026-01-28',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Canela (PC-CANELA-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  'PC-CANELA-001',
  'Canela',
  'gato',
  'fallecido',
  '2018-04-22',
  'canela',
  'Mestizo',
  'hembra',
  'pequeno',
  'Canela',
  4,
  true,
  '{"Ojos verdes","Pelo corto"}'::text[],
  NULL,
  'Mascota de demostración que muestra el estado ''fallecido'' (memorial) en el prototipo de adopción.',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  'Patitas con Causa',
  '5550123456',
  '5215550123456',
  NULL,
  'adopciones@patitasconcausa.mx',
  'Roma Norte',
  'Colonia Roma Norte, Ciudad de México',
  'Hola, tengo una duda sobre Canela.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  false,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  NULL
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  'Clínica Patitas',
  'Clínica Patitas',
  '5550123456',
  'Roma Norte, CDMX',
  'L-S 9am a 6pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '14e85e97-eb2b-5c7e-adb5-8177820f5870',
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  'Triple Felina',
  '2025-11-12',
  '2026-11-12',
  'TF55',
  'Dr. Pacheco',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  'c59e1794-68a4-5578-b8fa-f3f1e1589769',
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  'Rabia Felina',
  '2025-11-12',
  '2026-11-12',
  'RF08',
  'Dr. Pacheco',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_dewormings (
  id, pet_id, producto, fecha, proxima_fecha, dosis, veterinario, visible_publico
) VALUES (
  '8c46c2e5-f897-512f-a379-8a3952b4ae5f',
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  'Praziquantel',
  '2026-01-15',
  NULL,
  '½ tableta',
  'Dr. Pacheco',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_consultations (
  id, pet_id, fecha, motivo, diagnostico, tratamiento, medicamentos, veterinario, visible_publico
) VALUES (
  '91b6adc8-3e62-5d67-bee8-2648b923db99',
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  '2024-05-20',
  'Control geriátrico',
  'Enfermedad renal crónica en seguimiento',
  'Dieta renal y control de líquidos',
  '{"Suplemento renal"}'::text[],
  'Dra. Ríos',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_consultations (
  id, pet_id, fecha, motivo, diagnostico, tratamiento, medicamentos, veterinario, visible_publico
) VALUES (
  '8bfcd5d6-8e73-5abb-9856-1bca15da2ebc',
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  '2025-11-12',
  'Vacunación anual',
  NULL,
  'Esquema de vacunación felina',
  '{}'::text[],
  'Dr. Pacheco',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  'd6d5b63f-d4fd-59e1-8159-c4ff3778a9d4',
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  'Cartilla de vacunación',
  'vacunas',
  'pdf',
  'pawpass-documentos',
  'd6d5b63f-d4fd-59e1-8159-c4ff3778a9d4/cartilla-vacunacion.pdf',
  'application/pdf',
  1048576,
  '2025-11-12',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '1be2346e-733c-540b-941c-35b60fd526e1',
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  'Estudios médicos',
  'salud',
  'pdf',
  'pawpass-documentos',
  '1be2346e-733c-540b-941c-35b60fd526e1/estudios-medicos.pdf',
  'application/pdf',
  1048576,
  '2024-05-20',
  NULL,
  false
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Bruno (PC-BRUNO-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  'PC-BRUNO-001',
  'Bruno',
  'perro',
  'perdido',
  '2019-07-11',
  'bruno',
  'Mestizo',
  'macho',
  'grande',
  'Negro con blanco',
  22,
  true,
  '{"Collar azul","Cola sin punta"}'::text[],
  '900556677889900',
  'Mascota de demostración que muestra el estado ''perdido'' en el prototipo de adopción (nunca es candidato a adopción).',
  false
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  'Rincón Canino Ixtapaluca',
  '5550987654',
  '5215550987654',
  NULL,
  NULL,
  'Ixtapaluca Centro',
  'Ixtapaluca, Estado de México',
  'Hola, encontré a Bruno. Escaneé el QR de su collar.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  false,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Noble, algo reservado con desconocidos.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  'Veterinaria Rincón',
  'Vet Rincón',
  '5550987654',
  'Ixtapaluca, EDOMEX',
  'L-S 10am a 7pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_lost_alerts (
  id, pet_id, fecha_perdida, zona, mensaje, recompensa, instrucciones, ended_at
) VALUES (
  'bd46f1f4-8049-57e3-8ee7-282f00496136',
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  '2026-09-10',
  'Parque Nacional Ixtapaluca',
  'Bruno se perdió cerca del acceso al parque. Por favor ayuda a regresarlo con su refugio.',
  0,
  '{"Llámalo con voz tranquila.","No lo persigas.","Contacta al refugio por WhatsApp."}'::text[],
  NULL
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  'fd6896d8-21ce-5bb6-9eb4-c400f81c540f',
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  'Rabia',
  '2026-05-03',
  '2027-05-03',
  'A660',
  'Dr. Pacheco',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_dewormings (
  id, pet_id, producto, fecha, proxima_fecha, dosis, veterinario, visible_publico
) VALUES (
  '24915934-d4d9-5ce6-9188-e1ddf85cbb41',
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  'Praziquantel',
  '2026-04-22',
  '2026-10-22',
  '1 tableta',
  'Dr. Pacheco',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_consultations (
  id, pet_id, fecha, motivo, diagnostico, tratamiento, medicamentos, veterinario, visible_publico
) VALUES (
  'c1440614-34c0-5edd-8814-a5d5a8be81df',
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  '2026-04-20',
  'Chequeo previo a identificación',
  'Buen estado general',
  NULL,
  '{}'::text[],
  'Dr. Pacheco',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '45480bd3-fb1b-5b5e-917e-ce8fa37abe0d',
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  'Cartilla de vacunación',
  'vacunas',
  'pdf',
  'pawpass-documentos',
  '45480bd3-fb1b-5b5e-917e-ce8fa37abe0d/cartilla-vacunacion.pdf',
  'application/pdf',
  1048576,
  '2026-05-03',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Mocha (PC-MOCHA-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '9b15bd4e-b0dc-56a0-9b9f-0e30f4ce2179',
  'PC-MOCHA-001',
  'Mocha',
  'perro',
  'adoptado',
  '2020-06-10',
  'mocha',
  'Mestizo',
  'hembra',
  'mediano',
  'Café con orejas oscuras',
  12,
  true,
  '{"Cicatriz en pata trasera izquierda","Mancha clara en el lomo"}'::text[],
  NULL,
  'Rescatada y adoptada: muestra visual del estado adoptado tras el proceso de adopción (Fase 6).',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '9b15bd4e-b0dc-56a0-9b9f-0e30f4ce2179',
  'Familia Ramírez',
  '5567890123',
  '5215567890123',
  NULL,
  NULL,
  'cerca de casa',
  'Nezahualcóyotl, EDOMEX',
  'Hola, encontré a Mocha. Escaneé el QR de su perfil.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '9b15bd4e-b0dc-56a0-9b9f-0e30f4ce2179',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  false,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '9b15bd4e-b0dc-56a0-9b9f-0e30f4ce2179',
  '{}'::text[],
  '{"Artrosis leve"}'::text[],
  '{"Glucosamina"}'::text[],
  'Alimento hipocalórico',
  'Tranquila y muy leal; se lleva bien con niños.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '9b15bd4e-b0dc-56a0-9b9f-0e30f4ce2179',
  'Vet de Barrio',
  'Dr. Ruiz',
  '5567890123',
  'Av. Central 45, Neza',
  'L-S 9am a 6pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '21991b4b-8b15-56b4-a01f-85cebce3c407',
  '9b15bd4e-b0dc-56a0-9b9f-0e30f4ce2179',
  'Rabia',
  '2025-11-02',
  '2026-11-02',
  'R401',
  'Dr. Ruiz',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '3ccd22d7-6c12-5ecf-8622-8fe1e386d49c',
  '9b15bd4e-b0dc-56a0-9b9f-0e30f4ce2179',
  'Octuple',
  '2025-11-02',
  '2026-11-02',
  'O301',
  'Dr. Ruiz',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


INSERT INTO public.pet_dewormings (
  id, pet_id, producto, fecha, proxima_fecha, dosis, veterinario, visible_publico
) VALUES (
  'f1b2f3ed-b249-5cb3-9b73-7917b8b2c36c',
  '9b15bd4e-b0dc-56a0-9b9f-0e30f4ce2179',
  'Praziquantel',
  '2025-11-02',
  '2026-11-02',
  '1 tableta',
  'Dr. Ruiz',
  true
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_consultations (
  id, pet_id, fecha, motivo, diagnostico, tratamiento, medicamentos, veterinario, visible_publico
) VALUES (
  'eb8953cd-b13a-56d6-8d81-9628a6fa4852',
  '9b15bd4e-b0dc-56a0-9b9f-0e30f4ce2179',
  '2025-11-02',
  'Valoración post adopción',
  'Buena condición general; controlar peso.',
  'Dieta hipocalórica',
  '{"Glucosamina"}'::text[],
  'Dr. Ruiz',
  true
) ON CONFLICT (id) DO NOTHING;


-- Mascota: Copito (PC-COPITO-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '23689311-1d7d-5345-b064-99851ea2acbe',
  'PC-COPITO-001',
  'Copito',
  'perro',
  'rescatado',
  '2023-09-21',
  'copito',
  'Criollo',
  'macho',
  'pequeno',
  'Blanco con manchas grises',
  6,
  true,
  '{"Pata delantera derecha de color blanco","Muy sociable"}'::text[],
  '900111122233344',
  'Rescatado por el refugio: muestra visual del estado rescatado (Fase 6).',
  false
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '23689311-1d7d-5345-b064-99851ea2acbe',
  'Refugio Esperanza',
  '5576543210',
  '5215576543210',
  NULL,
  NULL,
  'dentro del refugio',
  'Iztapalapa, CDMX',
  'Hola, encontré a Copito. Escaneé el QR de su perfil.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '23689311-1d7d-5345-b064-99851ea2acbe',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  false,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '23689311-1d7d-5345-b064-99851ea2acbe',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  'Alimento balanceado para talla pequeña',
  'Juguetón y muy sociable con otros perros.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '23689311-1d7d-5345-b064-99851ea2acbe',
  'Vet Esperanza',
  'Dra. Paz',
  '5576543210',
  'Calz. Ermita 300, Iztapalapa',
  'L-D 9am a 5pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;


INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '3389b4db-ff29-5547-b227-ed4282998cf4',
  '23689311-1d7d-5345-b064-99851ea2acbe',
  'Rabia',
  '2026-01-15',
  '2027-01-15',
  'R502',
  'Dra. Paz',
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;


-- Mascota: Nube (PC-NUBE-001)
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '430a0fa4-67a8-5c99-863a-5c4daa8290f9',
  'PC-NUBE-001',
  'Nube',
  'gato',
  'en_casa',
  '2021-12-05',
  'nube',
  'Siamés',
  'hembra',
  'pequeno',
  'Cremita con puntas oscuras',
  3.5,
  true,
  '{"Ojos azules","Muy vocal"}'::text[],
  '900555667788899',
  'Mascota de casa sin número de contacto registrado: prueba el estado sin teléfono del carnet (Fase 6).',
  true
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;


INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '430a0fa4-67a8-5c99-863a-5c4daa8290f9',
  'Fam. de Nube',
  NULL,
  NULL,
  NULL,
  NULL,
  'cerca de casa',
  'Coyoacán, CDMX',
  'Hola, encontré a Nube. Vi su perfil en PawPass.'
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;


INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '430a0fa4-67a8-5c99-863a-5c4daa8290f9',
  true,
  false,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
  false,
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;


INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '430a0fa4-67a8-5c99-863a-5c4daa8290f9',
  '{}'::text[],
  '{}'::text[],
  '{}'::text[],
  NULL,
  'Juguetona y cariñosa, ronronea mucho.'
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;


INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '430a0fa4-67a8-5c99-863a-5c4daa8290f9',
  'Clínica Felina CDMX',
  'Dra. Mora',
  '5559876543',
  'Copilco 88, CDMX',
  'L-D 10am a 8pm'
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;

-- 3. VÍNCULOS REFUGIO <-> MASCOTA

INSERT INTO public.pet_shelters (
  id, pet_id, shelter_id, started_at, ended_at
) VALUES (
  'a55faf3e-fb9e-51ed-9d81-a85c218990a0',
  '79cc83c9-b5cc-5e96-974f-6c9533dab13b',
  'f77381be-43a0-56cb-ad1f-d93d33194c91',
  NOW(),
  NULL
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_shelters (
  id, pet_id, shelter_id, started_at, ended_at
) VALUES (
  'caa69746-f370-5b16-952d-22bf4dae7229',
  'd0d78e2c-1812-59b3-a239-1bcc20897602',
  'f77381be-43a0-56cb-ad1f-d93d33194c91',
  NOW(),
  NULL
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_shelters (
  id, pet_id, shelter_id, started_at, ended_at
) VALUES (
  'ec053124-989a-5ca3-b978-7ae01d50adc5',
  'c4702acf-93e5-50c6-be89-82c8e00fd08d',
  'f77381be-43a0-56cb-ad1f-d93d33194c91',
  NOW(),
  NULL
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_shelters (
  id, pet_id, shelter_id, started_at, ended_at
) VALUES (
  '6edccf42-7b3d-5de5-9668-9dd017cf7e4a',
  '6b638092-4493-59b3-b001-7c6b1ad5c207',
  '341e9ca1-e0c0-5e1b-ac6e-e9340c2e4d85',
  NOW(),
  NULL
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_shelters (
  id, pet_id, shelter_id, started_at, ended_at
) VALUES (
  '74b3125c-af9e-55f9-a13e-41a6bb232945',
  '06c72946-0b5b-5dfd-b3c8-e916803adcbc',
  '341e9ca1-e0c0-5e1b-ac6e-e9340c2e4d85',
  NOW(),
  NULL
) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.pet_shelters (
  id, pet_id, shelter_id, started_at, ended_at
) VALUES (
  '046d7120-91e4-505b-b1de-7a280ff28c15',
  '2bc8390d-8594-58ca-a21a-2c9e7a7cb38e',
  '341e9ca1-e0c0-5e1b-ac6e-e9340c2e4d85',
  NOW(),
  NULL
) ON CONFLICT (id) DO NOTHING;

COMMIT;

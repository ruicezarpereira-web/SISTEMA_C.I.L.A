-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'rh');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create servidores table
CREATE TABLE public.servidores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    data_nascimento DATE,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F')),
    matricula TEXT NOT NULL UNIQUE,
    registro_unico TEXT,
    rg TEXT,
    cpf TEXT,
    data_admissao DATE NOT NULL,
    cargo TEXT,
    lotacao TEXT,
    vinculo TEXT,
    filiacao TEXT,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for matricula search
CREATE INDEX idx_servidores_matricula ON public.servidores(matricula);
CREATE INDEX idx_servidores_nome ON public.servidores(nome);

-- Create processos table
CREATE TABLE public.processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE NOT NULL,
    numero_processo TEXT NOT NULL,
    processo_anterior TEXT,
    data_abertura DATE NOT NULL,
    quinquenio INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'PENDENTE', 'FINALIZADO')),
    situacao TEXT NOT NULL DEFAULT 'EM_ANALISE' CHECK (situacao IN ('DEFERIDO', 'INDEFERIDO', 'EM_ANALISE', 'DEFERIDO_PUBLICADO')),
    data_publicacao DATE,
    responsavel TEXT,
    nivel TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_processos_servidor ON public.processos(servidor_id);
CREATE INDEX idx_processos_numero ON public.processos(numero_processo);

-- Create faltas table
CREATE TABLE public.faltas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula TEXT NOT NULL,
    nome_servidor TEXT,
    evento TEXT,
    tipo_evento TEXT,
    competencia TEXT,
    referencia TEXT,
    tipo_referencia TEXT,
    tipo_folha TEXT,
    cargo TEXT,
    situacao TEXT,
    valor DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_faltas_matricula ON public.faltas(matricula);

-- Create afastamentos table
CREATE TABLE public.afastamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula TEXT NOT NULL,
    registro_unico TEXT,
    nome_servidor TEXT,
    motivo TEXT NOT NULL CHECK (motivo IN ('FERIAS', 'ATESTADO_LICENCA_MEDICA', 'LICENCA_PREMIO', 'OUTROS')),
    motivo_descricao TEXT,
    documento_referencia TEXT,
    inicio_relatorio DATE,
    fim_relatorio DATE,
    cadastro_afastamento DATE,
    inicio_evento DATE NOT NULL,
    fim_evento DATE NOT NULL,
    data_publicacao DATE,
    cargo TEXT,
    funcao TEXT,
    gerencia TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_afastamentos_matricula ON public.afastamentos(matricula);

-- Create configuracoes table
CREATE TABLE public.configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave TEXT NOT NULL UNIQUE,
    valor TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create autoridades table
CREATE TABLE public.autoridades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cargo TEXT NOT NULL,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create logs_atividade table
CREATE TABLE public.logs_atividade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    usuario TEXT,
    tipo_acao TEXT NOT NULL CHECK (tipo_acao IN ('UPLOAD', 'CERTIDAO_GERADA', 'PORTARIA_GERADA', 'LOGIN', 'LOGOUT', 'USUARIO_CRIADO', 'USUARIO_EDITADO', 'CONFIGURACAO_ALTERADA')),
    detalhes TEXT,
    ip TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afastamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autoridades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_atividade ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Helper function to check if current user is rh
CREATE OR REPLACE FUNCTION public.is_rh()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'rh')
$$;

-- Helper function to check if user has any valid role
CREATE OR REPLACE FUNCTION public.has_any_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() OR public.is_rh()
$$;

-- RLS Policies for user_roles (admin only)
CREATE POLICY "Admins can manage user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- RLS Policies for servidores (admin full, rh read-only)
CREATE POLICY "Users with role can view servidores"
ON public.servidores
FOR SELECT
TO authenticated
USING (public.has_any_role());

CREATE POLICY "Admins can insert servidores"
ON public.servidores
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update servidores"
ON public.servidores
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete servidores"
ON public.servidores
FOR DELETE
TO authenticated
USING (public.is_admin());

-- RLS Policies for processos (admin full, rh read-only)
CREATE POLICY "Users with role can view processos"
ON public.processos
FOR SELECT
TO authenticated
USING (public.has_any_role());

CREATE POLICY "Admins can insert processos"
ON public.processos
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update processos"
ON public.processos
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete processos"
ON public.processos
FOR DELETE
TO authenticated
USING (public.is_admin());

-- RLS Policies for faltas (admin full, rh read-only)
CREATE POLICY "Users with role can view faltas"
ON public.faltas
FOR SELECT
TO authenticated
USING (public.has_any_role());

CREATE POLICY "Admins can insert faltas"
ON public.faltas
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update faltas"
ON public.faltas
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete faltas"
ON public.faltas
FOR DELETE
TO authenticated
USING (public.is_admin());

-- RLS Policies for afastamentos (admin full, rh read-only)
CREATE POLICY "Users with role can view afastamentos"
ON public.afastamentos
FOR SELECT
TO authenticated
USING (public.has_any_role());

CREATE POLICY "Admins can insert afastamentos"
ON public.afastamentos
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update afastamentos"
ON public.afastamentos
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete afastamentos"
ON public.afastamentos
FOR DELETE
TO authenticated
USING (public.is_admin());

-- RLS Policies for configuracoes (admin only)
CREATE POLICY "Admins can manage configuracoes"
ON public.configuracoes
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for autoridades (admin full, rh read-only)
CREATE POLICY "Users with role can view autoridades"
ON public.autoridades
FOR SELECT
TO authenticated
USING (public.has_any_role());

CREATE POLICY "Admins can manage autoridades"
ON public.autoridades
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for logs_atividade (admin only)
CREATE POLICY "Admins can view logs"
ON public.logs_atividade
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Authenticated users can insert logs"
ON public.logs_atividade
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servidores_updated_at
BEFORE UPDATE ON public.servidores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processos_updated_at
BEFORE UPDATE ON public.processos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at
BEFORE UPDATE ON public.configuracoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, nome, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default configurations
INSERT INTO public.configuracoes (chave, valor) VALUES
('dias_quinquenio', '1826'),
('desconto_falta', '1'),
('desconto_atestado', '0'),
('cabecalho_padrao', 'PREFEITURA MUNICIPAL DE SALVADOR - TRANSALVADOR'),
('rodape_padrao', 'Documento gerado pelo Sistema de Gestão de Licenças Prêmio');
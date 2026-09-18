export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      afastamentos: {
        Row: {
          cadastro_afastamento: string | null
          cargo: string | null
          created_at: string
          data_publicacao: string | null
          documento_referencia: string | null
          fim_evento: string
          fim_relatorio: string | null
          funcao: string | null
          gerencia: string | null
          id: string
          inicio_evento: string
          inicio_relatorio: string | null
          matricula: string
          motivo: string
          motivo_descricao: string | null
          nome_servidor: string | null
          registro_unico: string | null
        }
        Insert: {
          cadastro_afastamento?: string | null
          cargo?: string | null
          created_at?: string
          data_publicacao?: string | null
          documento_referencia?: string | null
          fim_evento: string
          fim_relatorio?: string | null
          funcao?: string | null
          gerencia?: string | null
          id?: string
          inicio_evento: string
          inicio_relatorio?: string | null
          matricula: string
          motivo: string
          motivo_descricao?: string | null
          nome_servidor?: string | null
          registro_unico?: string | null
        }
        Update: {
          cadastro_afastamento?: string | null
          cargo?: string | null
          created_at?: string
          data_publicacao?: string | null
          documento_referencia?: string | null
          fim_evento?: string
          fim_relatorio?: string | null
          funcao?: string | null
          gerencia?: string | null
          id?: string
          inicio_evento?: string
          inicio_relatorio?: string | null
          matricula?: string
          motivo?: string
          motivo_descricao?: string | null
          nome_servidor?: string | null
          registro_unico?: string | null
        }
        Relationships: []
      }
      autoridades: {
        Row: {
          ativo: boolean | null
          cargo: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          cargo: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          cargo?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          id: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      faltas: {
        Row: {
          cargo: string | null
          competencia: string | null
          created_at: string
          evento: string | null
          id: string
          matricula: string
          nome_servidor: string | null
          referencia: string | null
          situacao: string | null
          tipo_evento: string | null
          tipo_folha: string | null
          tipo_referencia: string | null
          valor: number | null
        }
        Insert: {
          cargo?: string | null
          competencia?: string | null
          created_at?: string
          evento?: string | null
          id?: string
          matricula: string
          nome_servidor?: string | null
          referencia?: string | null
          situacao?: string | null
          tipo_evento?: string | null
          tipo_folha?: string | null
          tipo_referencia?: string | null
          valor?: number | null
        }
        Update: {
          cargo?: string | null
          competencia?: string | null
          created_at?: string
          evento?: string | null
          id?: string
          matricula?: string
          nome_servidor?: string | null
          referencia?: string | null
          situacao?: string | null
          tipo_evento?: string | null
          tipo_folha?: string | null
          tipo_referencia?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      gozos: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          dias: number
          id: string
          numero_periodo: number
          observacoes: string | null
          quinquenio_id: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          dias: number
          id?: string
          numero_periodo: number
          observacoes?: string | null
          quinquenio_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          dias?: number
          id?: string
          numero_periodo?: number
          observacoes?: string | null
          quinquenio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gozos_quinquenio_id_fkey"
            columns: ["quinquenio_id"]
            isOneToOne: false
            referencedRelation: "quinquenios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_atividade: {
        Row: {
          data_hora: string
          detalhes: string | null
          id: string
          ip: string | null
          tipo_acao: string
          user_id: string | null
          usuario: string | null
        }
        Insert: {
          data_hora?: string
          detalhes?: string | null
          id?: string
          ip?: string | null
          tipo_acao: string
          user_id?: string | null
          usuario?: string | null
        }
        Update: {
          data_hora?: string
          detalhes?: string | null
          id?: string
          ip?: string | null
          tipo_acao?: string
          user_id?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      matriculas_historico: {
        Row: {
          created_at: string
          id: string
          matricula: string
          servidor_id: string
          vigente_ate: string | null
          vigente_de: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          matricula: string
          servidor_id: string
          vigente_ate?: string | null
          vigente_de?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          matricula?: string
          servidor_id?: string
          vigente_ate?: string | null
          vigente_de?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_historico_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          dias_acrescimo: number
          documento_referencia: string | null
          id: string
          observacoes: string | null
          quantidade_dias: number
          servidor_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          dias_acrescimo?: number
          documento_referencia?: string | null
          id?: string
          observacoes?: string | null
          quantidade_dias?: number
          servidor_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          dias_acrescimo?: number
          documento_referencia?: string | null
          id?: string
          observacoes?: string | null
          quantidade_dias?: number
          servidor_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          created_at: string
          data_abertura: string
          data_publicacao: string | null
          id: string
          nivel: string | null
          numero_processo: string
          processo_anterior: string | null
          quinquenio: number
          responsavel: string | null
          servidor_id: string
          situacao: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_abertura: string
          data_publicacao?: string | null
          id?: string
          nivel?: string | null
          numero_processo: string
          processo_anterior?: string | null
          quinquenio: number
          responsavel?: string | null
          servidor_id: string
          situacao?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_abertura?: string
          data_publicacao?: string | null
          id?: string
          nivel?: string | null
          numero_processo?: string
          processo_anterior?: string | null
          quinquenio?: number
          responsavel?: string | null
          servidor_id?: string
          situacao?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deve_trocar_senha: boolean
          email: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deve_trocar_senha?: boolean
          email: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deve_trocar_senha?: boolean
          email?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quinquenios: {
        Row: {
          afetado_lc_173_2020: boolean
          created_at: string
          data_fim_ajustada: string
          data_fim_base: string
          data_inicio: string
          dias_acrescimo: number
          id: string
          numero: number
          processo_id: string | null
          retifica_quinquenio_id: string | null
          servidor_id: string
          status: string
          updated_at: string
        }
        Insert: {
          afetado_lc_173_2020?: boolean
          created_at?: string
          data_fim_ajustada: string
          data_fim_base: string
          data_inicio: string
          dias_acrescimo?: number
          id?: string
          numero: number
          processo_id?: string | null
          retifica_quinquenio_id?: string | null
          servidor_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          afetado_lc_173_2020?: boolean
          created_at?: string
          data_fim_ajustada?: string
          data_fim_base?: string
          data_inicio?: string
          dias_acrescimo?: number
          id?: string
          numero?: number
          processo_id?: string | null
          retifica_quinquenio_id?: string | null
          servidor_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quinquenios_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quinquenios_retifica_quinquenio_id_fkey"
            columns: ["retifica_quinquenio_id"]
            isOneToOne: false
            referencedRelation: "quinquenios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quinquenios_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
        ]
      }
      servidores: {
        Row: {
          cargo: string | null
          cpf: string | null
          created_at: string
          data_admissao: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          filiacao: string | null
          id: string
          lotacao: string | null
          matricula: string
          nome: string
          registro_unico: string
          rg: string | null
          sexo: string | null
          telefone: string | null
          updated_at: string
          vinculo: string | null
        }
        Insert: {
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          filiacao?: string | null
          id?: string
          lotacao?: string | null
          matricula: string
          nome: string
          registro_unico: string
          rg?: string | null
          sexo?: string | null
          telefone?: string | null
          updated_at?: string
          vinculo?: string | null
        }
        Update: {
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          filiacao?: string | null
          id?: string
          lotacao?: string | null
          matricula?: string
          nome?: string
          registro_unico?: string
          rg?: string | null
          sexo?: string | null
          telefone?: string | null
          updated_at?: string
          vinculo?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_rh: { Args: never; Returns: boolean }
      recalcular_quinquenio: {
        Args: { _quinquenio_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "rh"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "rh"],
    },
  },
} as const

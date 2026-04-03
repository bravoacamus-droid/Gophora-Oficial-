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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academy_courses: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          title: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      academy_paths: {
        Row: {
          created_at: string
          description: string | null
          description_es: string | null
          icon: string | null
          id: string
          sort_order: number | null
          title: string
          title_es: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_es?: string | null
          icon?: string | null
          id?: string
          sort_order?: number | null
          title: string
          title_es?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_es?: string | null
          icon?: string | null
          id?: string
          sort_order?: number | null
          title?: string
          title_es?: string | null
        }
        Relationships: []
      }
      academy_shared_prompts: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          likes: number | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          likes?: number | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          likes?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      academy_tools: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_es: string | null
          icon: string | null
          id: string
          name: string
          name_es: string | null
          url: string | null
          use_cases: string[] | null
          use_cases_es: string[] | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          description_es?: string | null
          icon?: string | null
          id?: string
          name: string
          name_es?: string | null
          url?: string | null
          use_cases?: string[] | null
          use_cases_es?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_es?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_es?: string | null
          url?: string | null
          use_cases?: string[] | null
          use_cases_es?: string[] | null
        }
        Relationships: []
      }
      active_logins: {
        Row: {
          last_seen: string | null
          user_id: string
        }
        Insert: {
          last_seen?: string | null
          user_id: string
        }
        Update: {
          last_seen?: string | null
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_code: string
          course_id: string
          course_title: string
          explorer_id: string
          explorer_name: string | null
          id: string
          issued_at: string
          tutor_name: string | null
        }
        Insert: {
          certificate_code?: string
          course_id: string
          course_title: string
          explorer_id: string
          explorer_name?: string | null
          id?: string
          issued_at?: string
          tutor_name?: string | null
        }
        Update: {
          certificate_code?: string
          course_id?: string
          course_title?: string
          explorer_id?: string
          explorer_name?: string | null
          id?: string
          issued_at?: string
          tutor_name?: string | null
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          budget_monthly: number | null
          company_name: string | null
          created_at: string | null
          id: string
          industry: string | null
          is_investor: boolean | null
          user_id: string | null
        }
        Insert: {
          budget_monthly?: number | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          is_investor?: boolean | null
          user_id?: string | null
        }
        Update: {
          budget_monthly?: number | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          is_investor?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      con_almacen: {
        Row: {
          codigo: string | null
          created_at: string | null
          descripcion: string
          id: string
          precio_unitario_promedio: number | null
          proyecto_id: string | null
          stock_actual: number | null
          stock_minimo: number | null
          ubicacion: string | null
          unidad: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string | null
          descripcion: string
          id?: string
          precio_unitario_promedio?: number | null
          proyecto_id?: string | null
          stock_actual?: number | null
          stock_minimo?: number | null
          ubicacion?: string | null
          unidad?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string | null
          descripcion?: string
          id?: string
          precio_unitario_promedio?: number | null
          proyecto_id?: string | null
          stock_actual?: number | null
          stock_minimo?: number | null
          ubicacion?: string | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_almacen_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_asignaciones_proyecto: {
        Row: {
          activo: boolean | null
          cargo_en_proyecto: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          personal_id: string | null
          proyecto_id: string | null
        }
        Insert: {
          activo?: boolean | null
          cargo_en_proyecto?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          personal_id?: string | null
          proyecto_id?: string | null
        }
        Update: {
          activo?: boolean | null
          cargo_en_proyecto?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          personal_id?: string | null
          proyecto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_asignaciones_proyecto_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "con_personal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_asignaciones_proyecto_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_asistencia: {
        Row: {
          estado: string | null
          fecha: string | null
          hora_entrada: string | null
          hora_salida: string | null
          horas_extra: number | null
          horas_normales: number | null
          id: string
          observaciones: string | null
          personal_id: string | null
          proyecto_id: string | null
        }
        Insert: {
          estado?: string | null
          fecha?: string | null
          hora_entrada?: string | null
          hora_salida?: string | null
          horas_extra?: number | null
          horas_normales?: number | null
          id?: string
          observaciones?: string | null
          personal_id?: string | null
          proyecto_id?: string | null
        }
        Update: {
          estado?: string | null
          fecha?: string | null
          hora_entrada?: string | null
          hora_salida?: string | null
          horas_extra?: number | null
          horas_normales?: number | null
          id?: string
          observaciones?: string | null
          personal_id?: string | null
          proyecto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_asistencia_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "con_personal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_asistencia_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_caja: {
        Row: {
          created_at: string | null
          estado: string | null
          id: string
          nombre: string | null
          proyecto_id: string | null
          responsable: string | null
          saldo_actual: number | null
          saldo_inicial: number | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          id?: string
          nombre?: string | null
          proyecto_id?: string | null
          responsable?: string | null
          saldo_actual?: number | null
          saldo_inicial?: number | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          id?: string
          nombre?: string | null
          proyecto_id?: string | null
          responsable?: string | null
          saldo_actual?: number | null
          saldo_inicial?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "con_caja_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_caja_chica: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_apertura: string | null
          fecha_cierre: string | null
          id: string
          monto_asignado: number | null
          monto_gastado: number | null
          proyecto_id: string | null
          responsable: string | null
          saldo: number | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          monto_asignado?: number | null
          monto_gastado?: number | null
          proyecto_id?: string | null
          responsable?: string | null
          saldo?: number | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          monto_asignado?: number | null
          monto_gastado?: number | null
          proyecto_id?: string | null
          responsable?: string | null
          saldo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "con_caja_chica_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_clientes: {
        Row: {
          contacto: string | null
          created_at: string | null
          departamento: string | null
          direccion: string | null
          distrito: string | null
          email: string | null
          estado: string | null
          id: string
          razon_social: string
          ruc: string | null
          telefono: string | null
          tipo: string | null
        }
        Insert: {
          contacto?: string | null
          created_at?: string | null
          departamento?: string | null
          direccion?: string | null
          distrito?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          razon_social: string
          ruc?: string | null
          telefono?: string | null
          tipo?: string | null
        }
        Update: {
          contacto?: string | null
          created_at?: string | null
          departamento?: string | null
          direccion?: string | null
          distrito?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          razon_social?: string
          ruc?: string | null
          telefono?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      con_contratos: {
        Row: {
          archivo_url: string | null
          cliente_id: string | null
          cotizacion_id: string | null
          created_at: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_firma: string | null
          fecha_inicio: string | null
          forma_pago: string | null
          garantia: string | null
          id: string
          monto_contrato: number | null
          numero: string | null
          observaciones: string | null
          penalidad_por_dia: number | null
          porcentaje_adelanto: number | null
          proyecto_id: string | null
        }
        Insert: {
          archivo_url?: string | null
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_firma?: string | null
          fecha_inicio?: string | null
          forma_pago?: string | null
          garantia?: string | null
          id?: string
          monto_contrato?: number | null
          numero?: string | null
          observaciones?: string | null
          penalidad_por_dia?: number | null
          porcentaje_adelanto?: number | null
          proyecto_id?: string | null
        }
        Update: {
          archivo_url?: string | null
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_firma?: string | null
          fecha_inicio?: string | null
          forma_pago?: string | null
          garantia?: string | null
          id?: string
          monto_contrato?: number | null
          numero?: string | null
          observaciones?: string | null
          penalidad_por_dia?: number | null
          porcentaje_adelanto?: number | null
          proyecto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "con_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_contratos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "con_cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_contratos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_cotizacion_items: {
        Row: {
          cantidad: number | null
          cotizacion_id: string | null
          descripcion: string
          id: string
          orden: number | null
          precio_unitario: number | null
          subtotal: number | null
          unidad: string | null
        }
        Insert: {
          cantidad?: number | null
          cotizacion_id?: string | null
          descripcion: string
          id?: string
          orden?: number | null
          precio_unitario?: number | null
          subtotal?: number | null
          unidad?: string | null
        }
        Update: {
          cantidad?: number | null
          cotizacion_id?: string | null
          descripcion?: string
          id?: string
          orden?: number | null
          precio_unitario?: number | null
          subtotal?: number | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "con_cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      con_cotizaciones: {
        Row: {
          cliente_id: string | null
          condiciones_pago: string | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha: string | null
          fecha_vencimiento: string | null
          id: string
          igv: number | null
          incluye_igv: boolean | null
          logo_url: string | null
          motivo_rechazo: string | null
          notes: string | null
          numero: string | null
          plazo_ejecucion: string | null
          proyecto_id: string | null
          subtotal: number | null
          titulo: string | null
          total: number | null
          validez_dias: number | null
        }
        Insert: {
          cliente_id?: string | null
          condiciones_pago?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string | null
          fecha_vencimiento?: string | null
          id?: string
          igv?: number | null
          incluye_igv?: boolean | null
          logo_url?: string | null
          motivo_rechazo?: string | null
          notes?: string | null
          numero?: string | null
          plazo_ejecucion?: string | null
          proyecto_id?: string | null
          subtotal?: number | null
          titulo?: string | null
          total?: number | null
          validez_dias?: number | null
        }
        Update: {
          cliente_id?: string | null
          condiciones_pago?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string | null
          fecha_vencimiento?: string | null
          id?: string
          igv?: number | null
          incluye_igv?: boolean | null
          logo_url?: string | null
          motivo_rechazo?: string | null
          notes?: string | null
          numero?: string | null
          plazo_ejecucion?: string | null
          proyecto_id?: string | null
          subtotal?: number | null
          titulo?: string | null
          total?: number | null
          validez_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "con_cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "con_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_cotizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_cuentas_cobrar: {
        Row: {
          cliente_id: string | null
          concepto: string | null
          created_at: string | null
          estado: string | null
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          monto_pagado: number | null
          monto_total: number | null
          numero_factura: string | null
          proyecto_id: string | null
          saldo: number | null
          valorizacion_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          concepto?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number | null
          monto_total?: number | null
          numero_factura?: string | null
          proyecto_id?: string | null
          saldo?: number | null
          valorizacion_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          concepto?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number | null
          monto_total?: number | null
          numero_factura?: string | null
          proyecto_id?: string | null
          saldo?: number | null
          valorizacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_cuentas_cobrar_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "con_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_cuentas_cobrar_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_cuentas_cobrar_valorizacion_id_fkey"
            columns: ["valorizacion_id"]
            isOneToOne: false
            referencedRelation: "con_valorizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      con_cuentas_pagar: {
        Row: {
          concepto: string | null
          created_at: string | null
          estado: string | null
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          monto_pagado: number | null
          monto_total: number | null
          numero_factura: string | null
          orden_compra_id: string | null
          proveedor_id: string | null
          proyecto_id: string | null
          saldo: number | null
        }
        Insert: {
          concepto?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number | null
          monto_total?: number | null
          numero_factura?: string | null
          orden_compra_id?: string | null
          proveedor_id?: string | null
          proyecto_id?: string | null
          saldo?: number | null
        }
        Update: {
          concepto?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number | null
          monto_total?: number | null
          numero_factura?: string | null
          orden_compra_id?: string | null
          proveedor_id?: string | null
          proyecto_id?: string | null
          saldo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "con_cuentas_pagar_orden_compra_id_fkey"
            columns: ["orden_compra_id"]
            isOneToOne: false
            referencedRelation: "con_ordenes_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_cuentas_pagar_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "con_proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_cuentas_pagar_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_gastos_caja_chica: {
        Row: {
          caja_chica_id: string | null
          categoria: string | null
          comprobante: string | null
          created_at: string | null
          descripcion: string | null
          fecha: string | null
          id: string
          monto: number | null
          proyecto_id: string | null
          responsable: string | null
        }
        Insert: {
          caja_chica_id?: string | null
          categoria?: string | null
          comprobante?: string | null
          created_at?: string | null
          descripcion?: string | null
          fecha?: string | null
          id?: string
          monto?: number | null
          proyecto_id?: string | null
          responsable?: string | null
        }
        Update: {
          caja_chica_id?: string | null
          categoria?: string | null
          comprobante?: string | null
          created_at?: string | null
          descripcion?: string | null
          fecha?: string | null
          id?: string
          monto?: number | null
          proyecto_id?: string | null
          responsable?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_gastos_caja_chica_caja_chica_id_fkey"
            columns: ["caja_chica_id"]
            isOneToOne: false
            referencedRelation: "con_caja_chica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_gastos_caja_chica_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_incidencias: {
        Row: {
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha: string | null
          id: string
          impacto: string | null
          proyecto_id: string | null
          reportado_por: string | null
          resolucion: string | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          impacto?: string | null
          proyecto_id?: string | null
          reportado_por?: string | null
          resolucion?: string | null
          tipo?: string | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          impacto?: string | null
          proyecto_id?: string | null
          reportado_por?: string | null
          resolucion?: string | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "con_incidencias_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_movimientos_almacen: {
        Row: {
          almacen_id: string | null
          cantidad: number | null
          created_at: string | null
          id: string
          observaciones: string | null
          origen: string | null
          precio_unitario: number | null
          proyecto_id: string | null
          referencia_id: string | null
          responsable: string | null
          tipo: string | null
          total: number | null
        }
        Insert: {
          almacen_id?: string | null
          cantidad?: number | null
          created_at?: string | null
          id?: string
          observaciones?: string | null
          origen?: string | null
          precio_unitario?: number | null
          proyecto_id?: string | null
          referencia_id?: string | null
          responsable?: string | null
          tipo?: string | null
          total?: number | null
        }
        Update: {
          almacen_id?: string | null
          cantidad?: number | null
          created_at?: string | null
          id?: string
          observaciones?: string | null
          origen?: string | null
          precio_unitario?: number | null
          proyecto_id?: string | null
          referencia_id?: string | null
          responsable?: string | null
          tipo?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "con_movimientos_almacen_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "con_almacen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_movimientos_almacen_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_movimientos_caja: {
        Row: {
          caja_id: string | null
          categoria: string | null
          comprobante_numero: string | null
          comprobante_tipo: string | null
          created_at: string | null
          descripcion: string
          fecha: string | null
          id: string
          monto: number
          proyecto_id: string | null
          referencia: string | null
          responsable: string | null
          tipo: string | null
        }
        Insert: {
          caja_id?: string | null
          categoria?: string | null
          comprobante_numero?: string | null
          comprobante_tipo?: string | null
          created_at?: string | null
          descripcion: string
          fecha?: string | null
          id?: string
          monto: number
          proyecto_id?: string | null
          referencia?: string | null
          responsable?: string | null
          tipo?: string | null
        }
        Update: {
          caja_id?: string | null
          categoria?: string | null
          comprobante_numero?: string | null
          comprobante_tipo?: string | null
          created_at?: string | null
          descripcion?: string
          fecha?: string | null
          id?: string
          monto?: number
          proyecto_id?: string | null
          referencia?: string | null
          responsable?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_movimientos_caja_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "con_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_movimientos_caja_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_orden_compra_items: {
        Row: {
          cantidad: number | null
          cantidad_recibida: number | null
          descripcion: string
          estado_recepcion: string | null
          id: string
          orden_id: string | null
          precio_unitario: number | null
          subtotal: number | null
          unidad: string | null
        }
        Insert: {
          cantidad?: number | null
          cantidad_recibida?: number | null
          descripcion: string
          estado_recepcion?: string | null
          id?: string
          orden_id?: string | null
          precio_unitario?: number | null
          subtotal?: number | null
          unidad?: string | null
        }
        Update: {
          cantidad?: number | null
          cantidad_recibida?: number | null
          descripcion?: string
          estado_recepcion?: string | null
          id?: string
          orden_id?: string | null
          precio_unitario?: number | null
          subtotal?: number | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_orden_compra_items_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "con_ordenes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      con_ordenes_compra: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha: string | null
          fecha_entrega_requerida: string | null
          id: string
          igv: number | null
          motivo_anulacion: string | null
          numero: string | null
          observaciones: string | null
          proveedor_id: string | null
          proyecto_id: string | null
          solicitante: string | null
          subtotal: number | null
          tipo: string | null
          total: number | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha?: string | null
          fecha_entrega_requerida?: string | null
          id?: string
          igv?: number | null
          motivo_anulacion?: string | null
          numero?: string | null
          observaciones?: string | null
          proveedor_id?: string | null
          proyecto_id?: string | null
          solicitante?: string | null
          subtotal?: number | null
          tipo?: string | null
          total?: number | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha?: string | null
          fecha_entrega_requerida?: string | null
          id?: string
          igv?: number | null
          motivo_anulacion?: string | null
          numero?: string | null
          observaciones?: string | null
          proveedor_id?: string | null
          proyecto_id?: string | null
          solicitante?: string | null
          subtotal?: number | null
          tipo?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "con_ordenes_compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "con_proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_ordenes_compra_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_pagos_cobrar: {
        Row: {
          created_at: string | null
          cuenta_id: string | null
          fecha: string | null
          id: string
          metodo: string | null
          monto: number | null
          referencia: string | null
        }
        Insert: {
          created_at?: string | null
          cuenta_id?: string | null
          fecha?: string | null
          id?: string
          metodo?: string | null
          monto?: number | null
          referencia?: string | null
        }
        Update: {
          created_at?: string | null
          cuenta_id?: string | null
          fecha?: string | null
          id?: string
          metodo?: string | null
          monto?: number | null
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_pagos_cobrar_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "con_cuentas_cobrar"
            referencedColumns: ["id"]
          },
        ]
      }
      con_partidas: {
        Row: {
          avance_metrado: number | null
          avance_porcentaje: number | null
          categoria: string | null
          codigo: string | null
          created_at: string | null
          estado: string | null
          id: string
          metrado: number | null
          nombre: string
          orden: number | null
          precio_unitario: number | null
          proyecto_id: string | null
          subtotal: number | null
          unidad: string | null
        }
        Insert: {
          avance_metrado?: number | null
          avance_porcentaje?: number | null
          categoria?: string | null
          codigo?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          metrado?: number | null
          nombre: string
          orden?: number | null
          precio_unitario?: number | null
          proyecto_id?: string | null
          subtotal?: number | null
          unidad?: string | null
        }
        Update: {
          avance_metrado?: number | null
          avance_porcentaje?: number | null
          categoria?: string | null
          codigo?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          metrado?: number | null
          nombre?: string
          orden?: number | null
          precio_unitario?: number | null
          proyecto_id?: string | null
          subtotal?: number | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_partidas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_personal: {
        Row: {
          apellidos: string
          cargo: string | null
          created_at: string | null
          dni: string | null
          email: string | null
          especialidad: string | null
          estado: string | null
          fecha_ingreso: string | null
          id: string
          nombres: string
          salario_base: number | null
          telefono: string | null
          tipo_contrato: string | null
          venc_sctr: string | null
          venc_seguro_vida: string | null
        }
        Insert: {
          apellidos: string
          cargo?: string | null
          created_at?: string | null
          dni?: string | null
          email?: string | null
          especialidad?: string | null
          estado?: string | null
          fecha_ingreso?: string | null
          id?: string
          nombres: string
          salario_base?: number | null
          telefono?: string | null
          tipo_contrato?: string | null
          venc_sctr?: string | null
          venc_seguro_vida?: string | null
        }
        Update: {
          apellidos?: string
          cargo?: string | null
          created_at?: string | null
          dni?: string | null
          email?: string | null
          especialidad?: string | null
          estado?: string | null
          fecha_ingreso?: string | null
          id?: string
          nombres?: string
          salario_base?: number | null
          telefono?: string | null
          tipo_contrato?: string | null
          venc_sctr?: string | null
          venc_seguro_vida?: string | null
        }
        Relationships: []
      }
      con_planilla: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_pago: string | null
          id: string
          periodo: string | null
          proyecto_id: string | null
          total_bruto: number | null
          total_descuentos: number | null
          total_neto: number | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_pago?: string | null
          id?: string
          periodo?: string | null
          proyecto_id?: string | null
          total_bruto?: number | null
          total_descuentos?: number | null
          total_neto?: number | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_pago?: string | null
          id?: string
          periodo?: string | null
          proyecto_id?: string | null
          total_bruto?: number | null
          total_descuentos?: number | null
          total_neto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "con_planilla_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      con_planilla_items: {
        Row: {
          bonificaciones: number | null
          descuento_afp: number | null
          descuento_essalud: number | null
          descuento_otros: number | null
          dias_trabajados: number | null
          horas_extra: number | null
          id: string
          monto_horas_extra: number | null
          personal_id: string | null
          planilla_id: string | null
          salario_base: number | null
          total_bruto: number | null
          total_descuentos: number | null
          total_neto: number | null
        }
        Insert: {
          bonificaciones?: number | null
          descuento_afp?: number | null
          descuento_essalud?: number | null
          descuento_otros?: number | null
          dias_trabajados?: number | null
          horas_extra?: number | null
          id?: string
          monto_horas_extra?: number | null
          personal_id?: string | null
          planilla_id?: string | null
          salario_base?: number | null
          total_bruto?: number | null
          total_descuentos?: number | null
          total_neto?: number | null
        }
        Update: {
          bonificaciones?: number | null
          descuento_afp?: number | null
          descuento_essalud?: number | null
          descuento_otros?: number | null
          dias_trabajados?: number | null
          horas_extra?: number | null
          id?: string
          monto_horas_extra?: number | null
          personal_id?: string | null
          planilla_id?: string | null
          salario_base?: number | null
          total_bruto?: number | null
          total_descuentos?: number | null
          total_neto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "con_planilla_items_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "con_personal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_planilla_items_planilla_id_fkey"
            columns: ["planilla_id"]
            isOneToOne: false
            referencedRelation: "con_planilla"
            referencedColumns: ["id"]
          },
        ]
      }
      con_proveedores: {
        Row: {
          contacto: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          estado: string | null
          id: string
          razon_social: string
          ruc: string | null
          telefono: string | null
          tipo: string | null
        }
        Insert: {
          contacto?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          razon_social: string
          ruc?: string | null
          telefono?: string | null
          tipo?: string | null
        }
        Update: {
          contacto?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          razon_social?: string
          ruc?: string | null
          telefono?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      con_proyectos: {
        Row: {
          avance_porcentaje: number | null
          cliente_id: string | null
          codigo: string | null
          created_at: string | null
          departamento: string | null
          descripcion: string | null
          distrito: string | null
          estado: string | null
          fecha_fin_estimada: string | null
          fecha_fin_real: string | null
          fecha_inicio: string | null
          id: string
          ingeniero_residente: string | null
          logo_url: string | null
          monto_contrato: number | null
          nombre: string
          presupuesto_adicional: number | null
          presupuesto_base: number | null
          supervisor: string | null
          tipo: string | null
          ubicacion: string | null
        }
        Insert: {
          avance_porcentaje?: number | null
          cliente_id?: string | null
          codigo?: string | null
          created_at?: string | null
          departamento?: string | null
          descripcion?: string | null
          distrito?: string | null
          estado?: string | null
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string | null
          id?: string
          ingeniero_residente?: string | null
          logo_url?: string | null
          monto_contrato?: number | null
          nombre: string
          presupuesto_adicional?: number | null
          presupuesto_base?: number | null
          supervisor?: string | null
          tipo?: string | null
          ubicacion?: string | null
        }
        Update: {
          avance_porcentaje?: number | null
          cliente_id?: string | null
          codigo?: string | null
          created_at?: string | null
          departamento?: string | null
          descripcion?: string | null
          distrito?: string | null
          estado?: string | null
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string | null
          id?: string
          ingeniero_residente?: string | null
          logo_url?: string | null
          monto_contrato?: number | null
          nombre?: string
          presupuesto_adicional?: number | null
          presupuesto_base?: number | null
          supervisor?: string | null
          tipo?: string | null
          ubicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_proyectos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "con_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      con_valorizacion_partidas: {
        Row: {
          avance_acumulado: number | null
          avance_anterior: number | null
          avance_periodo: number | null
          id: string
          metrado_periodo: number | null
          monto_periodo: number | null
          partida_id: string | null
          valorizacion_id: string | null
        }
        Insert: {
          avance_acumulado?: number | null
          avance_anterior?: number | null
          avance_periodo?: number | null
          id?: string
          metrado_periodo?: number | null
          monto_periodo?: number | null
          partida_id?: string | null
          valorizacion_id?: string | null
        }
        Update: {
          avance_acumulado?: number | null
          avance_anterior?: number | null
          avance_periodo?: number | null
          id?: string
          metrado_periodo?: number | null
          monto_periodo?: number | null
          partida_id?: string | null
          valorizacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_valorizacion_partidas_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "con_partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_valorizacion_partidas_valorizacion_id_fkey"
            columns: ["valorizacion_id"]
            isOneToOne: false
            referencedRelation: "con_valorizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      con_valorizaciones: {
        Row: {
          avance_periodo: number | null
          cliente_id: string | null
          contrato_id: string | null
          created_at: string | null
          estado: string | null
          fecha_presentacion: string | null
          id: string
          monto_adelanto_amortizado: number | null
          monto_neto: number | null
          monto_retencion: number | null
          monto_valorizado: number | null
          numero: string | null
          observaciones: string | null
          periodo_desde: string | null
          periodo_hasta: string | null
          proyecto_id: string | null
        }
        Insert: {
          avance_periodo?: number | null
          cliente_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_presentacion?: string | null
          id?: string
          monto_adelanto_amortizado?: number | null
          monto_neto?: number | null
          monto_retencion?: number | null
          monto_valorizado?: number | null
          numero?: string | null
          observaciones?: string | null
          periodo_desde?: string | null
          periodo_hasta?: string | null
          proyecto_id?: string | null
        }
        Update: {
          avance_periodo?: number | null
          cliente_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_presentacion?: string | null
          id?: string
          monto_adelanto_amortizado?: number | null
          monto_neto?: number | null
          monto_retencion?: number | null
          monto_valorizado?: number | null
          numero?: string | null
          observaciones?: string | null
          periodo_desde?: string | null
          periodo_hasta?: string | null
          proyecto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "con_valorizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "con_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_valorizaciones_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "con_contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "con_valorizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "con_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      course_exam_questions: {
        Row: {
          correct_index: number
          course_id: string
          created_at: string
          id: string
          options: Json
          options_es: Json
          question: string
          question_es: string | null
          sort_order: number | null
        }
        Insert: {
          correct_index?: number
          course_id: string
          created_at?: string
          id?: string
          options?: Json
          options_es?: Json
          question: string
          question_es?: string | null
          sort_order?: number | null
        }
        Update: {
          correct_index?: number
          course_id?: string
          created_at?: string
          id?: string
          options?: Json
          options_es?: Json
          question?: string
          question_es?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          completed: boolean | null
          course_id: string | null
          explorer_id: string | null
          id: string
          progress: number | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          course_id?: string | null
          explorer_id?: string | null
          id?: string
          progress?: number | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          course_id?: string | null
          explorer_id?: string | null
          id?: string
          progress?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_explorer_id_fkey"
            columns: ["explorer_id"]
            isOneToOne: false
            referencedRelation: "explorer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_ratings: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      deliverables: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          file_url: string | null
          id: string
          notes: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "mission_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "mission_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_clientes: {
        Row: {
          contacto: string | null
          created_at: string | null
          direccion: string | null
          distrito: string | null
          email: string | null
          estado: string | null
          id: string
          razon_social: string
          ruc: string | null
          saldo_pendiente: number | null
          telefono: string | null
          tiene_contrato: boolean | null
          tipo: string | null
        }
        Insert: {
          contacto?: string | null
          created_at?: string | null
          direccion?: string | null
          distrito?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          razon_social: string
          ruc?: string | null
          saldo_pendiente?: number | null
          telefono?: string | null
          tiene_contrato?: boolean | null
          tipo?: string | null
        }
        Update: {
          contacto?: string | null
          created_at?: string | null
          direccion?: string | null
          distrito?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          razon_social?: string
          ruc?: string | null
          saldo_pendiente?: number | null
          telefono?: string | null
          tiene_contrato?: boolean | null
          tipo?: string | null
        }
        Relationships: []
      }
      eco_contratos: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          frecuencia: string | null
          id: string
          modalidad: string | null
          numero: string | null
          observaciones: string | null
          precio: number | null
          tipo_residuo: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          frecuencia?: string | null
          id?: string
          modalidad?: string | null
          numero?: string | null
          observaciones?: string | null
          precio?: number | null
          tipo_residuo?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          frecuencia?: string | null
          id?: string
          modalidad?: string | null
          numero?: string | null
          observaciones?: string | null
          precio?: number | null
          tipo_residuo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eco_contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "eco_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_cuentas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          estado: string | null
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          monto_pagado: number | null
          monto_total: number | null
          numero_factura: string | null
          periodo: string | null
          saldo: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number | null
          monto_total?: number | null
          numero_factura?: string | null
          periodo?: string | null
          saldo?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number | null
          monto_total?: number | null
          numero_factura?: string | null
          periodo?: string | null
          saldo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eco_cuentas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "eco_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_flota: {
        Row: {
          aÃ±o: number | null
          capacidad_kg: number | null
          created_at: string | null
          estado: string | null
          id: string
          km_actual: number | null
          marca: string | null
          modelo: string | null
          placa: string
          tipo: string | null
          tipos_habilitados: string[] | null
          venc_minem: string | null
          venc_revision: string | null
          venc_soat: string | null
        }
        Insert: {
          aÃ±o?: number | null
          capacidad_kg?: number | null
          created_at?: string | null
          estado?: string | null
          id?: string
          km_actual?: number | null
          marca?: string | null
          modelo?: string | null
          placa: string
          tipo?: string | null
          tipos_habilitados?: string[] | null
          venc_minem?: string | null
          venc_revision?: string | null
          venc_soat?: string | null
        }
        Update: {
          aÃ±o?: number | null
          capacidad_kg?: number | null
          created_at?: string | null
          estado?: string | null
          id?: string
          km_actual?: number | null
          marca?: string | null
          modelo?: string | null
          placa?: string
          tipo?: string | null
          tipos_habilitados?: string[] | null
          venc_minem?: string | null
          venc_revision?: string | null
          venc_soat?: string | null
        }
        Relationships: []
      }
      eco_manifiestos: {
        Row: {
          cantidad_kg: number | null
          cliente_id: string | null
          codigo_residuo: string | null
          created_at: string | null
          descripcion: string | null
          empresa_disposicion: string | null
          estado: string | null
          fecha_disposicion: string | null
          fecha_generacion: string | null
          id: string
          numero: string | null
          numero_certificado: string | null
          orden_id: string | null
          tipo_residuo: string | null
        }
        Insert: {
          cantidad_kg?: number | null
          cliente_id?: string | null
          codigo_residuo?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_disposicion?: string | null
          estado?: string | null
          fecha_disposicion?: string | null
          fecha_generacion?: string | null
          id?: string
          numero?: string | null
          numero_certificado?: string | null
          orden_id?: string | null
          tipo_residuo?: string | null
        }
        Update: {
          cantidad_kg?: number | null
          cliente_id?: string | null
          codigo_residuo?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_disposicion?: string | null
          estado?: string | null
          fecha_disposicion?: string | null
          fecha_generacion?: string | null
          id?: string
          numero?: string | null
          numero_certificado?: string | null
          orden_id?: string | null
          tipo_residuo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eco_manifiestos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "eco_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_manifiestos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "eco_ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_mantenimientos: {
        Row: {
          costo: number | null
          created_at: string | null
          descripcion: string | null
          fecha: string | null
          id: string
          km_registro: number | null
          tipo: string | null
          vehiculo_id: string | null
        }
        Insert: {
          costo?: number | null
          created_at?: string | null
          descripcion?: string | null
          fecha?: string | null
          id?: string
          km_registro?: number | null
          tipo?: string | null
          vehiculo_id?: string | null
        }
        Update: {
          costo?: number | null
          created_at?: string | null
          descripcion?: string | null
          fecha?: string | null
          id?: string
          km_registro?: number | null
          tipo?: string | null
          vehiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eco_mantenimientos_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "eco_flota"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_operarios: {
        Row: {
          apellidos: string | null
          cargo: string | null
          created_at: string | null
          dni: string | null
          estado: string | null
          id: string
          nombres: string | null
          telefono: string | null
          venc_capacitacion: string | null
          venc_sanidad: string | null
        }
        Insert: {
          apellidos?: string | null
          cargo?: string | null
          created_at?: string | null
          dni?: string | null
          estado?: string | null
          id?: string
          nombres?: string | null
          telefono?: string | null
          venc_capacitacion?: string | null
          venc_sanidad?: string | null
        }
        Update: {
          apellidos?: string | null
          cargo?: string | null
          created_at?: string | null
          dni?: string | null
          estado?: string | null
          id?: string
          nombres?: string | null
          telefono?: string | null
          venc_capacitacion?: string | null
          venc_sanidad?: string | null
        }
        Relationships: []
      }
      eco_ordenes: {
        Row: {
          cliente_id: string | null
          contrato_id: string | null
          created_at: string | null
          descripcion: string | null
          direccion: string | null
          distrito: string | null
          estado: string | null
          facturada: boolean | null
          fecha_programada: string | null
          hora_programada: string | null
          id: string
          kg_estimados: number | null
          kg_reales: number | null
          numero: string | null
          operario_id: string | null
          precio: number | null
          requiere_manifiesto: boolean | null
          tipo_residuo: string | null
          vehiculo_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          direccion?: string | null
          distrito?: string | null
          estado?: string | null
          facturada?: boolean | null
          fecha_programada?: string | null
          hora_programada?: string | null
          id?: string
          kg_estimados?: number | null
          kg_reales?: number | null
          numero?: string | null
          operario_id?: string | null
          precio?: number | null
          requiere_manifiesto?: boolean | null
          tipo_residuo?: string | null
          vehiculo_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          direccion?: string | null
          distrito?: string | null
          estado?: string | null
          facturada?: boolean | null
          fecha_programada?: string | null
          hora_programada?: string | null
          id?: string
          kg_estimados?: number | null
          kg_reales?: number | null
          numero?: string | null
          operario_id?: string | null
          precio?: number | null
          requiere_manifiesto?: boolean | null
          tipo_residuo?: string | null
          vehiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eco_ordenes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "eco_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_ordenes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "eco_contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_ordenes_operario_id_fkey"
            columns: ["operario_id"]
            isOneToOne: false
            referencedRelation: "eco_operarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_ordenes_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "eco_flota"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_pagos: {
        Row: {
          created_at: string | null
          cuenta_id: string | null
          fecha: string | null
          id: string
          metodo: string | null
          monto: number | null
          referencia: string | null
        }
        Insert: {
          created_at?: string | null
          cuenta_id?: string | null
          fecha?: string | null
          id?: string
          metodo?: string | null
          monto?: number | null
          referencia?: string | null
        }
        Update: {
          created_at?: string | null
          cuenta_id?: string | null
          fecha?: string | null
          id?: string
          metodo?: string | null
          monto?: number | null
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eco_pagos_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "eco_cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_ruta_ordenes: {
        Row: {
          cantidad_real_kg: number | null
          created_at: string | null
          estado: string | null
          id: string
          orden_id: string | null
          orden_visita: number | null
          ruta_id: string | null
        }
        Insert: {
          cantidad_real_kg?: number | null
          created_at?: string | null
          estado?: string | null
          id?: string
          orden_id?: string | null
          orden_visita?: number | null
          ruta_id?: string | null
        }
        Update: {
          cantidad_real_kg?: number | null
          created_at?: string | null
          estado?: string | null
          id?: string
          orden_id?: string | null
          orden_visita?: number | null
          ruta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eco_ruta_ordenes_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "eco_ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_ruta_ordenes_ruta_id_fkey"
            columns: ["ruta_id"]
            isOneToOne: false
            referencedRelation: "eco_rutas"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_rutas: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha: string | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          km_recorridos: number | null
          nombre: string | null
          observaciones: string | null
          operario_ayudante_id: string | null
          operario_conductor_id: string | null
          vehiculo_id: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          km_recorridos?: number | null
          nombre?: string | null
          observaciones?: string | null
          operario_ayudante_id?: string | null
          operario_conductor_id?: string | null
          vehiculo_id?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          km_recorridos?: number | null
          nombre?: string | null
          observaciones?: string | null
          operario_ayudante_id?: string | null
          operario_conductor_id?: string | null
          vehiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eco_rutas_operario_ayudante_id_fkey"
            columns: ["operario_ayudante_id"]
            isOneToOne: false
            referencedRelation: "eco_operarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_rutas_operario_conductor_id_fkey"
            columns: ["operario_conductor_id"]
            isOneToOne: false
            referencedRelation: "eco_operarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_rutas_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "eco_flota"
            referencedColumns: ["id"]
          },
        ]
      }
      explorer_badges: {
        Row: {
          badge_icon: string
          badge_key: string
          badge_name: string
          badge_name_es: string | null
          earned_at: string
          explorer_id: string
          id: string
        }
        Insert: {
          badge_icon?: string
          badge_key: string
          badge_name: string
          badge_name_es?: string | null
          earned_at?: string
          explorer_id: string
          id?: string
        }
        Update: {
          badge_icon?: string
          badge_key?: string
          badge_name?: string
          badge_name_es?: string | null
          earned_at?: string
          explorer_id?: string
          id?: string
        }
        Relationships: []
      }
      explorer_course_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      explorer_daily_activity: {
        Row: {
          activity_date: string
          courses_viewed: number
          created_at: string
          exams_taken: number
          explorer_id: string
          id: string
          missions_activated: number
          missions_delivered: number
          xp_earned: number
        }
        Insert: {
          activity_date?: string
          courses_viewed?: number
          created_at?: string
          exams_taken?: number
          explorer_id: string
          id?: string
          missions_activated?: number
          missions_delivered?: number
          xp_earned?: number
        }
        Update: {
          activity_date?: string
          courses_viewed?: number
          created_at?: string
          exams_taken?: number
          explorer_id?: string
          id?: string
          missions_activated?: number
          missions_delivered?: number
          xp_earned?: number
        }
        Relationships: []
      }
      explorer_exam_attempts: {
        Row: {
          attempt_number: number
          completed_at: string
          course_id: string
          explorer_id: string
          id: string
          passed: boolean
          score: number
        }
        Insert: {
          attempt_number?: number
          completed_at?: string
          course_id: string
          explorer_id: string
          id?: string
          passed?: boolean
          score?: number
        }
        Update: {
          attempt_number?: number
          completed_at?: string
          course_id?: string
          explorer_id?: string
          id?: string
          passed?: boolean
          score?: number
        }
        Relationships: []
      }
      explorer_favorite_courses: {
        Row: {
          course_id: string
          created_at: string
          explorer_id: string
          id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          explorer_id: string
          id?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          explorer_id?: string
          id?: string
        }
        Relationships: []
      }
      explorer_profiles: {
        Row: {
          availability_hours: number | null
          created_at: string | null
          id: string
          level: number | null
          name: string | null
          rating: number | null
          skills: Json | null
          user_id: string | null
          xp: number | null
        }
        Insert: {
          availability_hours?: number | null
          created_at?: string | null
          id?: string
          level?: number | null
          name?: string | null
          rating?: number | null
          skills?: Json | null
          user_id?: string | null
          xp?: number | null
        }
        Update: {
          availability_hours?: number | null
          created_at?: string | null
          id?: string
          level?: number | null
          name?: string | null
          rating?: number | null
          skills?: Json | null
          user_id?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      explorer_skills: {
        Row: {
          category: string
          explorer_id: string
          id: string
          skill_level: number
          skill_name: string
          updated_at: string
          verification_source: string
          verified_by_exam: boolean
        }
        Insert: {
          category?: string
          explorer_id: string
          id?: string
          skill_level?: number
          skill_name: string
          updated_at?: string
          verification_source?: string
          verified_by_exam?: boolean
        }
        Update: {
          category?: string
          explorer_id?: string
          id?: string
          skill_level?: number
          skill_name?: string
          updated_at?: string
          verification_source?: string
          verified_by_exam?: boolean
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string | null
          id: string
          project_id: string | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      mission_assignments: {
        Row: {
          approved_at: string | null
          delivered_at: string | null
          delivery_url: string | null
          explorer_id: string | null
          funds_released_at: string | null
          funds_released_by: string | null
          id: string
          mission_id: string | null
          review_note: string | null
          reviewed_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["assignment_status"] | null
          submitted_at: string | null
        }
        Insert: {
          approved_at?: string | null
          delivered_at?: string | null
          delivery_url?: string | null
          explorer_id?: string | null
          funds_released_at?: string | null
          funds_released_by?: string | null
          id?: string
          mission_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          submitted_at?: string | null
        }
        Update: {
          approved_at?: string | null
          delivered_at?: string | null
          delivery_url?: string | null
          explorer_id?: string | null
          funds_released_at?: string | null
          funds_released_by?: string | null
          id?: string
          mission_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_assignments_explorer_id_fkey"
            columns: ["explorer_id"]
            isOneToOne: false
            referencedRelation: "explorer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_assignments_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          description_es: string | null
          hourly_rate: number | null
          hours: number | null
          id: string
          project_id: string | null
          requirements: string[] | null
          reward: number | null
          skill: string | null
          skills: string[] | null
          status: Database["public"]["Enums"]["mission_status"] | null
          title: string
          title_es: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          description_es?: string | null
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          project_id?: string | null
          requirements?: string[] | null
          reward?: number | null
          skill?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          title: string
          title_es?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          description_es?: string | null
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          project_id?: string | null
          requirements?: string[] | null
          reward?: number | null
          skill?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          title?: string
          title_es?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          explorer_id: string | null
          id: string
          mission_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          explorer_id?: string | null
          id?: string
          mission_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          explorer_id?: string | null
          id?: string
          mission_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_explorer_id_fkey"
            columns: ["explorer_id"]
            isOneToOne: false
            referencedRelation: "explorer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          education: string[] | null
          email: string | null
          full_name: string | null
          hobbies: string[] | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          onboarding_completed: boolean | null
          org_id: string | null
          role: string | null
          skills: string[] | null
          social_links: Json | null
          talents: string[] | null
          updated_at: string
          username: string | null
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education?: string[] | null
          email?: string | null
          full_name?: string | null
          hobbies?: string[] | null
          id: string
          interests?: string[] | null
          is_active?: boolean | null
          onboarding_completed?: boolean | null
          org_id?: string | null
          role?: string | null
          skills?: string[] | null
          social_links?: Json | null
          talents?: string[] | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education?: string[] | null
          email?: string | null
          full_name?: string | null
          hobbies?: string[] | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          onboarding_completed?: boolean | null
          org_id?: string | null
          role?: string | null
          skills?: string[] | null
          social_links?: Json | null
          talents?: string[] | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_missions: {
        Row: {
          id: string
          mission_id: string | null
          project_id: string | null
        }
        Insert: {
          id?: string
          mission_id?: string | null
          project_id?: string | null
        }
        Update: {
          id?: string
          mission_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_missions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          budget_needed: number | null
          category: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          payment_screenshot_url: string | null
          payment_status: string | null
          priority: string | null
          resource_link: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          title: string
          tx_hash: string | null
          user_id: string | null
          video_link: string | null
        }
        Insert: {
          budget?: number | null
          budget_needed?: number | null
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          payment_screenshot_url?: string | null
          payment_status?: string | null
          priority?: string | null
          resource_link?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          title: string
          tx_hash?: string | null
          user_id?: string | null
          video_link?: string | null
        }
        Update: {
          budget?: number | null
          budget_needed?: number | null
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          payment_screenshot_url?: string | null
          payment_status?: string | null
          priority?: string | null
          resource_link?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          title?: string
          tx_hash?: string | null
          user_id?: string | null
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ret_categorias: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      ret_kardex: {
        Row: {
          cantidad: number
          created_at: string | null
          fecha: string | null
          id: string
          motivo: string | null
          precio_unitario: number | null
          producto_id: string | null
          proveedor_id: string | null
          referencia: string | null
          tipo: string | null
          total: number | null
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          fecha?: string | null
          id?: string
          motivo?: string | null
          precio_unitario?: number | null
          producto_id?: string | null
          proveedor_id?: string | null
          referencia?: string | null
          tipo?: string | null
          total?: number | null
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          fecha?: string | null
          id?: string
          motivo?: string | null
          precio_unitario?: number | null
          producto_id?: string | null
          proveedor_id?: string | null
          referencia?: string | null
          tipo?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ret_kardex_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "ret_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ret_kardex_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "ret_proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      ret_productos: {
        Row: {
          categoria_id: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          imagen_url: string | null
          nombre: string
          precio_compra: number | null
          precio_venta: number | null
          sku: string
          stock_actual: number | null
          stock_minimo: number | null
          unidad: string | null
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre: string
          precio_compra?: number | null
          precio_venta?: number | null
          sku: string
          stock_actual?: number | null
          stock_minimo?: number | null
          unidad?: string | null
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio_compra?: number | null
          precio_venta?: number | null
          sku?: string
          stock_actual?: number | null
          stock_minimo?: number | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ret_productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "ret_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      ret_proveedores: {
        Row: {
          categoria: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          id: string
          razon_social: string
          ruc: string
          telefono: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          razon_social: string
          ruc: string
          telefono?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          razon_social?: string
          ruc?: string
          telefono?: string | null
        }
        Relationships: []
      }
      ret_sesiones_caja: {
        Row: {
          estado: string | null
          fecha_apertura: string | null
          fecha_cierre: string | null
          id: string
          saldo_final: number | null
          saldo_inicial: number
          usuario: string
        }
        Insert: {
          estado?: string | null
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          saldo_final?: number | null
          saldo_inicial: number
          usuario: string
        }
        Update: {
          estado?: string | null
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          saldo_final?: number | null
          saldo_inicial?: number
          usuario?: string
        }
        Relationships: []
      }
      ret_ventas: {
        Row: {
          caja_id: string | null
          created_at: string | null
          estado: string | null
          fecha: string | null
          id: string
          igv: number | null
          metodo_pago: string | null
          numero: string
          serie: string | null
          subtotal: number | null
          total: number | null
          vendedor: string | null
        }
        Insert: {
          caja_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          igv?: number | null
          metodo_pago?: string | null
          numero: string
          serie?: string | null
          subtotal?: number | null
          total?: number | null
          vendedor?: string | null
        }
        Update: {
          caja_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          igv?: number | null
          metodo_pago?: string | null
          numero?: string
          serie?: string | null
          subtotal?: number | null
          total?: number | null
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ret_ventas_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "ret_sesiones_caja"
            referencedColumns: ["id"]
          },
        ]
      }
      ret_ventas_items: {
        Row: {
          cantidad: number | null
          id: string
          nombre_producto: string | null
          precio_unitario: number | null
          producto_id: string | null
          subtotal: number | null
          venta_id: string | null
        }
        Insert: {
          cantidad?: number | null
          id?: string
          nombre_producto?: string | null
          precio_unitario?: number | null
          producto_id?: string | null
          subtotal?: number | null
          venta_id?: string | null
        }
        Update: {
          cantidad?: number | null
          id?: string
          nombre_producto?: string | null
          precio_unitario?: number | null
          producto_id?: string | null
          subtotal?: number | null
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ret_ventas_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "ret_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ret_ventas_items_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ret_ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_asistencia: {
        Row: {
          created_at: string | null
          empleado_id: string | null
          fecha: string
          hora_entrada: string | null
          hora_salida: string | null
          horas_extra: number | null
          id: string
          observaciones: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          empleado_id?: string | null
          fecha: string
          hora_entrada?: string | null
          hora_salida?: string | null
          horas_extra?: number | null
          id?: string
          observaciones?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          empleado_id?: string | null
          fecha?: string
          hora_entrada?: string | null
          hora_salida?: string | null
          horas_extra?: number | null
          id?: string
          observaciones?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_asistencia_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "saf_empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_cierre_mensual: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_cierre: string | null
          id: string
          periodo_anio: number | null
          periodo_mes: number | null
          total_compras: number | null
          total_igv_compras: number | null
          total_igv_ventas: number | null
          total_ventas: number | null
          utilidad_bruta: number | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_cierre?: string | null
          id?: string
          periodo_anio?: number | null
          periodo_mes?: number | null
          total_compras?: number | null
          total_igv_compras?: number | null
          total_igv_ventas?: number | null
          total_ventas?: number | null
          utilidad_bruta?: number | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_cierre?: string | null
          id?: string
          periodo_anio?: number | null
          periodo_mes?: number | null
          total_compras?: number | null
          total_igv_compras?: number | null
          total_igv_ventas?: number | null
          total_ventas?: number | null
          utilidad_bruta?: number | null
        }
        Relationships: []
      }
      saf_clientes: {
        Row: {
          contacto: string | null
          created_at: string | null
          credito_habilitado: boolean | null
          direccion: string | null
          email: string | null
          id: string
          limite_credito: number | null
          razon_social: string
          ruc: string | null
          saldo_pendiente: number | null
          telefono: string | null
          tipo: string | null
        }
        Insert: {
          contacto?: string | null
          created_at?: string | null
          credito_habilitado?: boolean | null
          direccion?: string | null
          email?: string | null
          id?: string
          limite_credito?: number | null
          razon_social: string
          ruc?: string | null
          saldo_pendiente?: number | null
          telefono?: string | null
          tipo?: string | null
        }
        Update: {
          contacto?: string | null
          created_at?: string | null
          credito_habilitado?: boolean | null
          direccion?: string | null
          email?: string | null
          id?: string
          limite_credito?: number | null
          razon_social?: string
          ruc?: string | null
          saldo_pendiente?: number | null
          telefono?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      saf_conductores: {
        Row: {
          apellidos: string | null
          celular: string | null
          created_at: string | null
          dni: string | null
          estado: string | null
          id: string
          licencia_categoria: string | null
          licencia_numero: string | null
          licencia_vencimiento: string | null
          nombres: string | null
          token_gps: string | null
        }
        Insert: {
          apellidos?: string | null
          celular?: string | null
          created_at?: string | null
          dni?: string | null
          estado?: string | null
          id?: string
          licencia_categoria?: string | null
          licencia_numero?: string | null
          licencia_vencimiento?: string | null
          nombres?: string | null
          token_gps?: string | null
        }
        Update: {
          apellidos?: string | null
          celular?: string | null
          created_at?: string | null
          dni?: string | null
          estado?: string | null
          id?: string
          licencia_categoria?: string | null
          licencia_numero?: string | null
          licencia_vencimiento?: string | null
          nombres?: string | null
          token_gps?: string | null
        }
        Relationships: []
      }
      saf_cotizacion_items: {
        Row: {
          cantidad: number | null
          cotizacion_id: string | null
          id: string
          precio_unitario: number | null
          producto_id: string | null
          subtotal: number | null
        }
        Insert: {
          cantidad?: number | null
          cotizacion_id?: string | null
          id?: string
          precio_unitario?: number | null
          producto_id?: string | null
          subtotal?: number | null
        }
        Update: {
          cantidad?: number | null
          cotizacion_id?: string | null
          id?: string
          precio_unitario?: number | null
          producto_id?: string | null
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "saf_cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saf_cotizacion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "saf_productos"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_cotizaciones: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          estado: string | null
          fecha: string | null
          fecha_vencimiento: string | null
          id: string
          igv: number | null
          numero: string | null
          observaciones: string | null
          subtotal: number | null
          total: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha?: string | null
          fecha_vencimiento?: string | null
          id?: string
          igv?: number | null
          numero?: string | null
          observaciones?: string | null
          subtotal?: number | null
          total?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha?: string | null
          fecha_vencimiento?: string | null
          id?: string
          igv?: number | null
          numero?: string | null
          observaciones?: string | null
          subtotal?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "saf_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_cuentas_por_cobrar: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          estado: string | null
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          monto_pagado: number | null
          monto_total: number | null
          numero_factura: string | null
          orden_id: string | null
          saldo: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number | null
          monto_total?: number | null
          numero_factura?: string | null
          orden_id?: string | null
          saldo?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number | null
          monto_total?: number | null
          numero_factura?: string | null
          orden_id?: string | null
          saldo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_cuentas_por_cobrar_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "saf_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saf_cuentas_por_cobrar_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "saf_ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_despachos: {
        Row: {
          conductor: string | null
          created_at: string | null
          destino: string | null
          dni_conductor: string | null
          estado: string | null
          fecha_despacho: string | null
          hora_entrega: string | null
          hora_salida: string | null
          id: string
          observaciones: string | null
          orden_id: string | null
          placa: string | null
        }
        Insert: {
          conductor?: string | null
          created_at?: string | null
          destino?: string | null
          dni_conductor?: string | null
          estado?: string | null
          fecha_despacho?: string | null
          hora_entrega?: string | null
          hora_salida?: string | null
          id?: string
          observaciones?: string | null
          orden_id?: string | null
          placa?: string | null
        }
        Update: {
          conductor?: string | null
          created_at?: string | null
          destino?: string | null
          dni_conductor?: string | null
          estado?: string | null
          fecha_despacho?: string | null
          hora_entrega?: string | null
          hora_salida?: string | null
          id?: string
          observaciones?: string | null
          orden_id?: string | null
          placa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_despachos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "saf_ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_empleado_documentos: {
        Row: {
          created_at: string | null
          empleado_id: string | null
          fecha_vencimiento: string | null
          id: string
          nombre_archivo: string | null
          tipo: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          empleado_id?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre_archivo?: string | null
          tipo?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          empleado_id?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre_archivo?: string | null
          tipo?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_empleado_documentos_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "saf_empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_empleados: {
        Row: {
          afp_comision_porcentaje: number | null
          afp_nombre: string | null
          apellidos: string
          area: string | null
          banco: string | null
          cargo: string
          cci: string | null
          celular: string | null
          conductor_id: string | null
          created_at: string | null
          direccion: string | null
          dni: string
          email: string | null
          estado: string | null
          estado_civil: string | null
          fecha_cese: string | null
          fecha_ingreso: string
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          nombres: string
          numero_cuenta_banco: string | null
          regimen_laboral: string | null
          remuneracion_bruta: number
          sexo: string | null
          sistema_pensionario: string | null
          tipo_contrato: string | null
        }
        Insert: {
          afp_comision_porcentaje?: number | null
          afp_nombre?: string | null
          apellidos: string
          area?: string | null
          banco?: string | null
          cargo: string
          cci?: string | null
          celular?: string | null
          conductor_id?: string | null
          created_at?: string | null
          direccion?: string | null
          dni: string
          email?: string | null
          estado?: string | null
          estado_civil?: string | null
          fecha_cese?: string | null
          fecha_ingreso: string
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombres: string
          numero_cuenta_banco?: string | null
          regimen_laboral?: string | null
          remuneracion_bruta: number
          sexo?: string | null
          sistema_pensionario?: string | null
          tipo_contrato?: string | null
        }
        Update: {
          afp_comision_porcentaje?: number | null
          afp_nombre?: string | null
          apellidos?: string
          area?: string | null
          banco?: string | null
          cargo?: string
          cci?: string | null
          celular?: string | null
          conductor_id?: string | null
          created_at?: string | null
          direccion?: string | null
          dni?: string
          email?: string | null
          estado?: string | null
          estado_civil?: string | null
          fecha_cese?: string | null
          fecha_ingreso?: string
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombres?: string
          numero_cuenta_banco?: string | null
          regimen_laboral?: string | null
          remuneracion_bruta?: number
          sexo?: string | null
          sistema_pensionario?: string | null
          tipo_contrato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_empleados_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "saf_conductores"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_flota: {
        Row: {
          aÃ±o: number | null
          capacidad_m3: number | null
          conductor_asignado_id: string | null
          created_at: string | null
          estado: string | null
          foto_url: string | null
          id: string
          km_actual: number | null
          marca: string | null
          modelo: string | null
          placa: string | null
          tipo: string | null
          vencimiento_revision: string | null
          vencimiento_soat: string | null
        }
        Insert: {
          aÃ±o?: number | null
          capacidad_m3?: number | null
          conductor_asignado_id?: string | null
          created_at?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          km_actual?: number | null
          marca?: string | null
          modelo?: string | null
          placa?: string | null
          tipo?: string | null
          vencimiento_revision?: string | null
          vencimiento_soat?: string | null
        }
        Update: {
          aÃ±o?: number | null
          capacidad_m3?: number | null
          conductor_asignado_id?: string | null
          created_at?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          km_actual?: number | null
          marca?: string | null
          modelo?: string | null
          placa?: string | null
          tipo?: string | null
          vencimiento_revision?: string | null
          vencimiento_soat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_conductor"
            columns: ["conductor_asignado_id"]
            isOneToOne: false
            referencedRelation: "saf_conductores"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_gastos_operativos: {
        Row: {
          adjunto_url: string | null
          area_responsable: string | null
          base_imponible: number | null
          categoria: string | null
          correlativo: string | null
          created_at: string | null
          cuo: string | null
          derecho_credito_fiscal: boolean | null
          descripcion: string | null
          estado_sire: string | null
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          igv: number | null
          importe_total: number
          moneda: string | null
          numero: string | null
          razon_social_proveedor: string | null
          ruc_proveedor: string | null
          serie: string | null
          tipo_cambio: number | null
          tipo_comprobante: string
          tipo_doc_proveedor: string | null
        }
        Insert: {
          adjunto_url?: string | null
          area_responsable?: string | null
          base_imponible?: number | null
          categoria?: string | null
          correlativo?: string | null
          created_at?: string | null
          cuo?: string | null
          derecho_credito_fiscal?: boolean | null
          descripcion?: string | null
          estado_sire?: string | null
          fecha_emision: string
          fecha_vencimiento?: string | null
          id?: string
          igv?: number | null
          importe_total: number
          moneda?: string | null
          numero?: string | null
          razon_social_proveedor?: string | null
          ruc_proveedor?: string | null
          serie?: string | null
          tipo_cambio?: number | null
          tipo_comprobante: string
          tipo_doc_proveedor?: string | null
        }
        Update: {
          adjunto_url?: string | null
          area_responsable?: string | null
          base_imponible?: number | null
          categoria?: string | null
          correlativo?: string | null
          created_at?: string | null
          cuo?: string | null
          derecho_credito_fiscal?: boolean | null
          descripcion?: string | null
          estado_sire?: string | null
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          igv?: number | null
          importe_total?: number
          moneda?: string | null
          numero?: string | null
          razon_social_proveedor?: string | null
          ruc_proveedor?: string | null
          serie?: string | null
          tipo_cambio?: number | null
          tipo_comprobante?: string
          tipo_doc_proveedor?: string | null
        }
        Relationships: []
      }
      saf_gps_ubicaciones: {
        Row: {
          conductor_id: string | null
          id: string
          latitud: number
          longitud: number
          precision_metros: number | null
          timestamp: string | null
          velocidad_kmh: number | null
          viaje_id: string | null
        }
        Insert: {
          conductor_id?: string | null
          id?: string
          latitud: number
          longitud: number
          precision_metros?: number | null
          timestamp?: string | null
          velocidad_kmh?: number | null
          viaje_id?: string | null
        }
        Update: {
          conductor_id?: string | null
          id?: string
          latitud?: number
          longitud?: number
          precision_metros?: number | null
          timestamp?: string | null
          velocidad_kmh?: number | null
          viaje_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_gps_ubicaciones_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "saf_conductores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saf_gps_ubicaciones_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "saf_viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_mantenimientos: {
        Row: {
          costo_soles: number | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha: string | null
          id: string
          kilometraje_en_mantenimiento: number | null
          proveedor: string | null
          tipo: string | null
          vehiculo_id: string | null
        }
        Insert: {
          costo_soles?: number | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          kilometraje_en_mantenimiento?: number | null
          proveedor?: string | null
          tipo?: string | null
          vehiculo_id?: string | null
        }
        Update: {
          costo_soles?: number | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          kilometraje_en_mantenimiento?: number | null
          proveedor?: string | null
          tipo?: string | null
          vehiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_mantenimientos_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "saf_flota"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_orden_items: {
        Row: {
          cantidad: number | null
          id: string
          orden_id: string | null
          precio_unitario: number | null
          producto_id: string | null
          subtotal: number | null
        }
        Insert: {
          cantidad?: number | null
          id?: string
          orden_id?: string | null
          precio_unitario?: number | null
          producto_id?: string | null
          subtotal?: number | null
        }
        Update: {
          cantidad?: number | null
          id?: string
          orden_id?: string | null
          precio_unitario?: number | null
          producto_id?: string | null
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_orden_items_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "saf_ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saf_orden_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "saf_productos"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_ordenes: {
        Row: {
          cliente_id: string | null
          cotizacion_id: string | null
          created_at: string | null
          estado: string | null
          fecha: string | null
          fecha_requerida: string | null
          id: string
          igv: number | null
          motivo_anulacion: string | null
          numero: string | null
          observaciones: string | null
          subtotal: number | null
          tipo_pago: string | null
          total: number | null
        }
        Insert: {
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha?: string | null
          fecha_requerida?: string | null
          id?: string
          igv?: number | null
          motivo_anulacion?: string | null
          numero?: string | null
          observaciones?: string | null
          subtotal?: number | null
          tipo_pago?: string | null
          total?: number | null
        }
        Update: {
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha?: string | null
          fecha_requerida?: string | null
          id?: string
          igv?: number | null
          motivo_anulacion?: string | null
          numero?: string | null
          observaciones?: string | null
          subtotal?: number | null
          tipo_pago?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_ordenes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "saf_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saf_ordenes_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "saf_cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_pagos: {
        Row: {
          created_at: string | null
          cuenta_id: string | null
          fecha: string | null
          id: string
          metodo: string | null
          monto: number | null
          referencia: string | null
        }
        Insert: {
          created_at?: string | null
          cuenta_id?: string | null
          fecha?: string | null
          id?: string
          metodo?: string | null
          monto?: number | null
          referencia?: string | null
        }
        Update: {
          created_at?: string | null
          cuenta_id?: string | null
          fecha?: string | null
          id?: string
          metodo?: string | null
          monto?: number | null
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_pagos_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "saf_cuentas_por_cobrar"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_planilla: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_aprobacion: string | null
          fecha_pago: string | null
          id: string
          periodo_anio: number
          periodo_mes: number
          total_bruto: number | null
          total_descuentos: number | null
          total_essalud_empleador: number | null
          total_neto: number | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_pago?: string | null
          id?: string
          periodo_anio: number
          periodo_mes: number
          total_bruto?: number | null
          total_descuentos?: number | null
          total_essalud_empleador?: number | null
          total_neto?: number | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_pago?: string | null
          id?: string
          periodo_anio?: number
          periodo_mes?: number
          total_bruto?: number | null
          total_descuentos?: number | null
          total_essalud_empleador?: number | null
          total_neto?: number | null
        }
        Relationships: []
      }
      saf_planilla_detalle: {
        Row: {
          aporte_pension: number | null
          asignacion_familiar: number | null
          bonificacion_ext_monto: number | null
          created_at: string | null
          cts_mensual_provisionado: number | null
          descuento_faltas: number | null
          descuento_prestamos: number | null
          descuento_tardanzas: number | null
          dias_falta: number | null
          dias_trabajados: number | null
          empleado_id: string | null
          essalud_empleador: number | null
          gratificacion_monto: number | null
          horas_extra_monto: number | null
          id: string
          neto_a_pagar: number | null
          planilla_id: string | null
          prima_seguro: number | null
          remuneracion_bruta: number | null
          renta_quinta_categoria: number | null
          total_descuentos: number | null
          total_ingresos: number | null
        }
        Insert: {
          aporte_pension?: number | null
          asignacion_familiar?: number | null
          bonificacion_ext_monto?: number | null
          created_at?: string | null
          cts_mensual_provisionado?: number | null
          descuento_faltas?: number | null
          descuento_prestamos?: number | null
          descuento_tardanzas?: number | null
          dias_falta?: number | null
          dias_trabajados?: number | null
          empleado_id?: string | null
          essalud_empleador?: number | null
          gratificacion_monto?: number | null
          horas_extra_monto?: number | null
          id?: string
          neto_a_pagar?: number | null
          planilla_id?: string | null
          prima_seguro?: number | null
          remuneracion_bruta?: number | null
          renta_quinta_categoria?: number | null
          total_descuentos?: number | null
          total_ingresos?: number | null
        }
        Update: {
          aporte_pension?: number | null
          asignacion_familiar?: number | null
          bonificacion_ext_monto?: number | null
          created_at?: string | null
          cts_mensual_provisionado?: number | null
          descuento_faltas?: number | null
          descuento_prestamos?: number | null
          descuento_tardanzas?: number | null
          dias_falta?: number | null
          dias_trabajados?: number | null
          empleado_id?: string | null
          essalud_empleador?: number | null
          gratificacion_monto?: number | null
          horas_extra_monto?: number | null
          id?: string
          neto_a_pagar?: number | null
          planilla_id?: string | null
          prima_seguro?: number | null
          remuneracion_bruta?: number | null
          renta_quinta_categoria?: number | null
          total_descuentos?: number | null
          total_ingresos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_planilla_detalle_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "saf_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saf_planilla_detalle_planilla_id_fkey"
            columns: ["planilla_id"]
            isOneToOne: false
            referencedRelation: "saf_planilla"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_produccion: {
        Row: {
          cantidad_producida: number | null
          combustible_litros: number | null
          created_at: string | null
          fecha: string | null
          horas_maquina: number | null
          id: string
          observaciones: string | null
          operador: string | null
          producto_id: string | null
        }
        Insert: {
          cantidad_producida?: number | null
          combustible_litros?: number | null
          created_at?: string | null
          fecha?: string | null
          horas_maquina?: number | null
          id?: string
          observaciones?: string | null
          operador?: string | null
          producto_id?: string | null
        }
        Update: {
          cantidad_producida?: number | null
          combustible_litros?: number | null
          created_at?: string | null
          fecha?: string | null
          horas_maquina?: number | null
          id?: string
          observaciones?: string | null
          operador?: string | null
          producto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_produccion_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "saf_productos"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_productos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          id: string
          nombre: string
          precio_unitario: number | null
          stock_actual: number | null
          stock_minimo: number | null
          unidad: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          nombre: string
          precio_unitario?: number | null
          stock_actual?: number | null
          stock_minimo?: number | null
          unidad?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          nombre?: string
          precio_unitario?: number | null
          stock_actual?: number | null
          stock_minimo?: number | null
          unidad?: string | null
        }
        Relationships: []
      }
      saf_registro_ventas: {
        Row: {
          base_exonerado: number | null
          base_imponible_gravado: number | null
          base_inafecto: number | null
          correlativo: string | null
          created_at: string | null
          cuo: string | null
          estado_sire: string | null
          factura_id: string | null
          fecha_emision: string
          fecha_emision_ref: string | null
          id: string
          igv: number | null
          importe_total: number
          moneda: string | null
          numero: string | null
          numero_ref: string | null
          razon_social_cliente: string | null
          ruc_dni_cliente: string | null
          serie: string | null
          serie_ref: string | null
          tipo_cambio: number | null
          tipo_comprobante: string
          tipo_doc_cliente: string | null
          tipo_doc_ref: string | null
        }
        Insert: {
          base_exonerado?: number | null
          base_imponible_gravado?: number | null
          base_inafecto?: number | null
          correlativo?: string | null
          created_at?: string | null
          cuo?: string | null
          estado_sire?: string | null
          factura_id?: string | null
          fecha_emision: string
          fecha_emision_ref?: string | null
          id?: string
          igv?: number | null
          importe_total: number
          moneda?: string | null
          numero?: string | null
          numero_ref?: string | null
          razon_social_cliente?: string | null
          ruc_dni_cliente?: string | null
          serie?: string | null
          serie_ref?: string | null
          tipo_cambio?: number | null
          tipo_comprobante: string
          tipo_doc_cliente?: string | null
          tipo_doc_ref?: string | null
        }
        Update: {
          base_exonerado?: number | null
          base_imponible_gravado?: number | null
          base_inafecto?: number | null
          correlativo?: string | null
          created_at?: string | null
          cuo?: string | null
          estado_sire?: string | null
          factura_id?: string | null
          fecha_emision?: string
          fecha_emision_ref?: string | null
          id?: string
          igv?: number | null
          importe_total?: number
          moneda?: string | null
          numero?: string | null
          numero_ref?: string | null
          razon_social_cliente?: string | null
          ruc_dni_cliente?: string | null
          serie?: string | null
          serie_ref?: string | null
          tipo_cambio?: number | null
          tipo_comprobante?: string
          tipo_doc_cliente?: string | null
          tipo_doc_ref?: string | null
        }
        Relationships: []
      }
      saf_subpase_registros: {
        Row: {
          comprobante_tipo: string | null
          concepto: string | null
          conductor_id: string | null
          created_at: string | null
          estado: string | null
          fecha: string
          id: string
          monto: number | null
          ruta: string | null
          sustento_url: string | null
          vehiculo_id: string | null
        }
        Insert: {
          comprobante_tipo?: string | null
          concepto?: string | null
          conductor_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha: string
          id?: string
          monto?: number | null
          ruta?: string | null
          sustento_url?: string | null
          vehiculo_id?: string | null
        }
        Update: {
          comprobante_tipo?: string | null
          concepto?: string | null
          conductor_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha?: string
          id?: string
          monto?: number | null
          ruta?: string | null
          sustento_url?: string | null
          vehiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_subpase_registros_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "saf_conductores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saf_subpase_registros_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "saf_flota"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_vacaciones: {
        Row: {
          created_at: string | null
          dias_tomados: number | null
          empleado_id: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          dias_tomados?: number | null
          empleado_id?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          dias_tomados?: number | null
          empleado_id?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saf_vacaciones_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "saf_empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      saf_viajes: {
        Row: {
          cliente: string | null
          conductor_id: string | null
          created_at: string | null
          despacho_id: string | null
          destino: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          observaciones: string | null
          origen: string | null
          vehiculo_id: string | null
        }
        Insert: {
          cliente?: string | null
          conductor_id?: string | null
          created_at?: string | null
          despacho_id?: string | null
          destino?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          observaciones?: string | null
          origen?: string | null
          vehiculo_id?: string | null
        }
        Update: {
          cliente?: string | null
          conductor_id?: string | null
          created_at?: string | null
          despacho_id?: string | null
          destino?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          observaciones?: string | null
          origen?: string | null
          vehiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saf_viajes_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "saf_conductores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saf_viajes_despacho_id_fkey"
            columns: ["despacho_id"]
            isOneToOne: false
            referencedRelation: "saf_despachos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saf_viajes_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "saf_flota"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_passports: {
        Row: {
          badges: Json | null
          explorer_id: string | null
          id: string
          missions_completed: number | null
          skills_verified: Json | null
          updated_at: string | null
        }
        Insert: {
          badges?: Json | null
          explorer_id?: string | null
          id?: string
          missions_completed?: number | null
          skills_verified?: Json | null
          updated_at?: string | null
        }
        Update: {
          badges?: Json | null
          explorer_id?: string | null
          id?: string
          missions_completed?: number | null
          skills_verified?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_passports_explorer_id_fkey"
            columns: ["explorer_id"]
            isOneToOne: false
            referencedRelation: "explorer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_applications: {
        Row: {
          admin_note: string | null
          bio: string
          created_at: string
          expertise: string[] | null
          id: string
          portfolio_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          bio: string
          created_at?: string
          expertise?: string[] | null
          id?: string
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          bio?: string
          created_at?: string
          expertise?: string[] | null
          id?: string
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_followers: {
        Row: {
          created_at: string
          explorer_id: string
          id: string
          tutor_id: string
        }
        Insert: {
          created_at?: string
          explorer_id: string
          id?: string
          tutor_id: string
        }
        Update: {
          created_at?: string
          explorer_id?: string
          id?: string
          tutor_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          amount: number
          bank_account: string | null
          bank_holder: string | null
          bank_name: string | null
          created_at: string
          crypto_address: string | null
          crypto_network: string | null
          id: string
          method: string
          processed_at: string | null
          processed_by: string | null
          qr_image_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          created_at?: string
          crypto_address?: string | null
          crypto_network?: string | null
          id?: string
          method: string
          processed_at?: string | null
          processed_by?: string | null
          qr_image_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          created_at?: string
          crypto_address?: string | null
          crypto_network?: string | null
          id?: string
          method?: string
          processed_at?: string | null
          processed_by?: string | null
          qr_image_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      mission_applications: {
        Row: {
          delivered_at: string | null
          delivery_url: string | null
          funds_released_at: string | null
          funds_released_by: string | null
          id: string | null
          mission_id: string | null
          review_note: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["assignment_status"] | null
          user_id: string | null
        }
        Insert: {
          delivered_at?: string | null
          delivery_url?: string | null
          funds_released_at?: string | null
          funds_released_by?: string | null
          id?: string | null
          mission_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          user_id?: string | null
        }
        Update: {
          delivered_at?: string | null
          delivery_url?: string | null
          funds_released_at?: string | null
          funds_released_by?: string | null
          id?: string | null
          mission_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_assignments_explorer_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "explorer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_assignments_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_email_exists: { Args: { lookup_email: string }; Returns: boolean }
      check_is_logged_in: { Args: { _email: string }; Returns: boolean }
      delete_login_heartbeat: { Args: { _user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_course_views: {
        Args: { _course_id: string }
        Returns: undefined
      }
      update_login_heartbeat: { Args: { _user_id: string }; Returns: undefined }
      update_retail_stock: {
        Args: { p_cant: number; p_id: string }
        Returns: undefined
      }
      verify_user_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_role: "explorer" | "company"
      app_role: "admin" | "moderator" | "user" | "tutor"
      assignment_status:
        | "assigned"
        | "in_progress"
        | "submitted"
        | "approved"
        | "rejected"
        | "completed"
        | "funds_released"
      mission_status:
        | "open"
        | "in_progress"
        | "completed"
        | "pending"
        | "approved"
        | "rejected"
      payment_status: "pending" | "paid"
      project_status: "funding" | "active" | "completed"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      account_role: ["explorer", "company"],
      app_role: ["admin", "moderator", "user", "tutor"],
      assignment_status: [
        "assigned",
        "in_progress",
        "submitted",
        "approved",
        "rejected",
        "completed",
        "funds_released",
      ],
      mission_status: [
        "open",
        "in_progress",
        "completed",
        "pending",
        "approved",
        "rejected",
      ],
      payment_status: ["pending", "paid"],
      project_status: ["funding", "active", "completed"],
    },
  },
} as const


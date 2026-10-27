export interface paths {
    "/v1/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Sesi agen aktif (dari cookie SSO) */
        get: operations["getSession"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Akhiri sesi SSO */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/master-data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Status, antrean, dan prioritas case beserta label dan warna badge */
        get: operations["getMasterData"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/cases": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar case dengan filter, sort, dan pagination di server */
        get: operations["listCases"];
        put?: never;
        /** Buat case baru (usulan; contoh pola form, kaitan customer belum dirancang) */
        post: operations["createCase"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/cases/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Jumlah case per antrean untuk badge navigasi */
        get: operations["getCaseSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/cases/{caseId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detail case beserta timeline */
        get: operations["getCase"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Ubah status, antrean, prioritas, atau assignee */
        patch: operations["updateCase"];
        trace?: never;
    };
    "/v1/cases/{caseId}/replies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Kirim balasan ke customer atau catatan internal */
        post: operations["createReply"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/customers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar customer dengan pencarian dan pagination di server */
        get: operations["listCustomers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/customers/{customerId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Profil customer */
        get: operations["getCustomer"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ErrorResponse: {
            /**
             * @example unauthorized
             * @example forbidden
             * @example not_found
             * @example conflict
             * @example validation_error
             */
            code: string;
            message: string;
            requestId?: string;
        };
        /** @enum {string} */
        Role: "l1" | "l2" | "supervisor" | "admin";
        /** @description Kode status dari master data (`GET /v1/master-data`) */
        CaseStatus: string;
        /** @description Kode antrean dari master data (`GET /v1/master-data`) */
        Queue: string;
        /** @description Kode prioritas dari master data (`GET /v1/master-data`) */
        Priority: string;
        MasterDataItem: {
            code: string;
            /** @description Teks tampilan, sudah dilokalkan oleh server */
            label: string;
            /**
             * @description Warna badge
             * @enum {string}
             */
            tone: "neutral" | "info" | "success" | "warning" | "danger" | "muted";
        };
        MasterData: {
            statuses: components["schemas"]["MasterDataItem"][];
            queues: components["schemas"]["MasterDataItem"][];
            priorities: components["schemas"]["MasterDataItem"][];
        };
        Session: {
            user: components["schemas"]["User"];
            /** Format: date-time */
            expiresAt: string;
        };
        User: {
            id: string;
            name: string;
            /** Format: email */
            email: string;
            role: components["schemas"]["Role"];
        };
        Customer: {
            id: string;
            name: string;
            /** @description Dimasking di UI sesuai role */
            phone?: string | null;
            email?: string | null;
            /** @description Dimasking di UI sesuai role */
            address?: string | null;
        };
        /** @enum {string} */
        CustomerSegment: "regular" | "business" | "priority";
        CustomerProfile: {
            id: string;
            name: string;
            segment: components["schemas"]["CustomerSegment"];
            city: string;
            /** @description Dimasking di UI sesuai role */
            phone?: string | null;
            email?: string | null;
            /** @description Dimasking di UI sesuai role */
            address?: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        CustomerListResponse: {
            items: components["schemas"]["CustomerProfile"][];
            meta: components["schemas"]["PageMeta"];
        };
        Case: {
            id: string;
            /** @example CASE-2026-00123 */
            code: string;
            subject: string;
            description?: string;
            status: components["schemas"]["CaseStatus"];
            queue: components["schemas"]["Queue"];
            priority: components["schemas"]["Priority"];
            assignee?: components["schemas"]["User"] | null;
            customer: components["schemas"]["Customer"];
            shipmentId?: string | null;
            sttNumber?: string | null;
            tags?: string[];
            /** Format: date-time */
            slaDueAt?: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            timeline: components["schemas"]["TimelineEntry"][];
        };
        TimelineEntry: {
            id: string;
            /** @enum {string} */
            type: "note" | "reply" | "status_change" | "assignment";
            author: components["schemas"]["User"];
            body?: string | null;
            /** @enum {string} */
            visibility: "internal" | "customer";
            /** Format: date-time */
            createdAt: string;
        };
        CaseListResponse: {
            items: components["schemas"]["Case"][];
            meta: components["schemas"]["PageMeta"];
        };
        PageMeta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        CaseSummary: {
            /** @description Jumlah case terbuka per kode antrean */
            queues: {
                [key: string]: number;
            };
            unassigned: number;
            overdue: number;
        };
        CreateCaseRequest: {
            subject: string;
            description?: string;
            priority: components["schemas"]["Priority"];
            queue: components["schemas"]["Queue"];
        };
        UpdateCaseRequest: {
            status?: components["schemas"]["CaseStatus"];
            queue?: components["schemas"]["Queue"];
            priority?: components["schemas"]["Priority"];
            assigneeId?: string | null;
        };
        CreateReplyRequest: {
            body: string;
            /** @enum {string} */
            visibility: "internal" | "customer";
        };
        /** @description Payload SSE pada endpoint /v1/events/stream */
        CaseEvent: {
            id: string;
            /** @enum {string} */
            type: "case.created" | "case.updated" | "case.assigned" | "case.escalated";
            caseId: string;
            /** Format: date-time */
            occurredAt: string;
            status?: components["schemas"]["CaseStatus"];
            priority?: components["schemas"]["Priority"];
            assignee?: components["schemas"]["User"] | null;
        };
    };
    responses: {
        /** @description Sesi tidak ada atau kedaluwarsa */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Role tidak punya izin */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Case tidak ditemukan */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
    };
    parameters: {
        CaseId: string;
        CustomerId: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sesi aktif */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Session"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sesi diakhiri */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    getMasterData: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Master data */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MasterData"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    listCases: {
        parameters: {
            query?: {
                status?: components["schemas"]["CaseStatus"];
                queue?: components["schemas"]["Queue"];
                view?: "all" | "mine" | "unassigned";
                /** @description Pencarian teks pada kode, subjek, dan nama customer */
                q?: string;
                sort?: "-updated_at" | "updated_at" | "-created_at" | "created_at" | "-priority";
                page?: number;
                page_size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Halaman case */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CaseListResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    createCase: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCaseRequest"];
            };
        };
        responses: {
            /** @description Case yang dibuat */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Case"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            /** @description Isian tidak valid */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getCaseSummary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ringkasan antrean */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CaseSummary"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    getCase: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                caseId: components["parameters"]["CaseId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Detail case */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Case"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updateCase: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                caseId: components["parameters"]["CaseId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCaseRequest"];
            };
        };
        responses: {
            /** @description Case setelah diubah */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Case"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description Case sudah diubah agen lain (konflik versi) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createReply: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                caseId: components["parameters"]["CaseId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateReplyRequest"];
            };
        };
        responses: {
            /** @description Entri timeline yang baru dibuat */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TimelineEntry"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description Validasi gagal */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listCustomers: {
        parameters: {
            query?: {
                q?: string;
                page?: number;
                page_size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Daftar customer */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerListResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    getCustomer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                customerId: components["parameters"]["CustomerId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Profil customer */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerProfile"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
}

import { useMemo, useState } from "react";
import { Box } from "@twilio-paste/core/box";
import { Button } from "@twilio-paste/core/button";
import { Card } from "@twilio-paste/core/card";
import { Heading } from "@twilio-paste/core/heading";
import { Input } from "@twilio-paste/core/input";
import { Checkbox, CheckboxGroup } from "@twilio-paste/core/checkbox";
import { Stack } from "@twilio-paste/core/stack";
import { Badge } from "@twilio-paste/core/badge";
import { Text } from "@twilio-paste/core/text";
import { Table, THead, TBody, Tr, Th, Td } from "@twilio-paste/core/table";
import {
  Modal,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
  ModalFooterActions,
} from "@twilio-paste/core/modal";
import { RefreshIcon } from "@twilio-paste/icons/esm/RefreshIcon";
import { SearchIcon } from "@twilio-paste/icons/esm/SearchIcon";
import { OrderRecord, TargetState, advanceState } from "./api";

type Props = {
  orders: OrderRecord[];
  loading: boolean;
  onRefresh: () => void;
  onActionComplete: (message: string) => void;
  onActionError: (message: string) => void;
};

const ALL_STATES = ["Ordered", "Selecting", "Building", "Built", "Delivered"] as const;
type StateName = (typeof ALL_STATES)[number];

const STATUS_VARIANT: Record<string, "neutral" | "info" | "warning" | "success"> = {
  Ordered: "neutral",
  Selecting: "info",
  Building: "warning",
  Built: "success",
  Delivered: "success",
};

const NEXT_ACTION: Record<string, { label: string; target: TargetState } | null> = {
  Ordered: { label: "Mover a Selecting", target: "Selecting" },
  Selecting: { label: "Mover a Building", target: "Building" },
  Building: { label: "Mover a Built", target: "Built" },
  Built: { label: "Marcar como Delivered", target: "Delivered" },
  Delivered: null,
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX");
}

function buildSummary(f: OrderRecord["fields"]): string {
  return [f.Cuerpo, f.Tono, f.Cabello, f.Cara, f.Mano, f.Mano2, f.ToqueFinal]
    .filter(Boolean)
    .join(" · ");
}

export function OrderTable({
  orders,
  loading,
  onRefresh,
  onActionComplete,
  onActionError,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [visibleStates, setVisibleStates] = useState<Set<StateName>>(
    () => new Set(ALL_STATES)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<{
    order: OrderRecord;
    target: TargetState;
    label: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return orders.filter((o) => {
      const f = o.fields;
      const status = (f.Status || "Ordered") as StateName;
      if (!visibleStates.has(status)) return false;
      if (!q) return true;
      return [
        String(f.OrderId ?? ""),
        f.NombreCaja ?? "",
        f.WhatsAppAddress ?? "",
        f.Status ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [orders, filter, visibleStates]);

  const toggleState = (state: StateName) => {
    setVisibleStates((prev) => {
      const next = new Set(prev);
      if (next.has(state)) next.delete(state);
      else next.add(state);
      return next;
    });
  };

  const handleSearch = () => setFilter(searchQuery);

  const runAdvance = async (order: OrderRecord, target: TargetState) => {
    setBusy(true);
    try {
      const result = await advanceState(order.id, target);
      const orderNum = order.fields.OrderId ?? "?";
      const msg = result.skipped
        ? `#${orderNum} ya estaba en ${result.newState}. Sin cambios.`
        : `#${orderNum} → ${result.newState}. WhatsApp enviado.`;
      onActionComplete(msg);
    } catch (err) {
      onActionError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onActionClick = (
    order: OrderRecord,
    action: { label: string; target: TargetState }
  ) => {
    if (action.target === "Built" || action.target === "Delivered") {
      setSelected({ order, target: action.target, label: action.label });
      setIsModalOpen(true);
      return;
    }
    void runAdvance(order, action.target);
  };

  const confirmAdvance = async () => {
    if (!selected) return;
    await runAdvance(selected.order, selected.target);
    setIsModalOpen(false);
  };

  return (
    <Box padding="space60">
      <Stack orientation="vertical" spacing="space60">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading as="h1" variant="heading10">
            Órdenes de Builders
          </Heading>
          <Button variant="secondary" onClick={onRefresh} loading={loading}>
            <RefreshIcon decorative />
            Actualizar
          </Button>
        </Box>

        <Box display="flex" columnGap="space40">
          <Input
            type="text"
            placeholder="Buscar por número de orden, nombre en caja, WhatsApp o estado"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <Box width="10px">&nbsp;</Box>
          <Button variant="secondary" onClick={handleSearch} loading={loading}>
            <SearchIcon decorative />
            Buscar
          </Button>
        </Box>

        <CheckboxGroup
          name="visible-states"
          legend="Mostrar estados"
          orientation="horizontal"
        >
          {ALL_STATES.map((state) => (
            <Checkbox
              key={state}
              id={`state-${state}`}
              value={state}
              checked={visibleStates.has(state)}
              onChange={() => toggleState(state)}
            >
              {state}
            </Checkbox>
          ))}
        </CheckboxGroup>

        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>Número de Orden</Th>
                <Th>Nombre en Caja</Th>
                <Th>WhatsApp</Th>
                <Th>Build</Th>
                <Th>Estado</Th>
                <Th>Última Actualización</Th>
                <Th>Acciones</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.length === 0 && !loading && (
                <Tr>
                  <Td colSpan={7}>
                    <Text as="span" color="colorTextWeak">
                      No hay órdenes.
                    </Text>
                  </Td>
                </Tr>
              )}
              {filtered.map((order) => {
                const f = order.fields;
                const status = f.Status || "Ordered";
                const action = NEXT_ACTION[status];
                return (
                  <Tr key={order.id}>
                    <Td>#{f.OrderId}</Td>
                    <Td>{f.NombreCaja || "—"}</Td>
                    <Td>{f.WhatsAppAddress ? f.WhatsAppAddress.replace(/^whatsapp:/, "") : "—"}</Td>
                    <Td>
                      <Text as="span" fontSize="fontSize20" color="colorTextWeak">
                        {buildSummary(f) || "—"}
                      </Text>
                    </Td>
                    <Td>
                      <Badge as="span" variant={STATUS_VARIANT[status] || "neutral"}>
                        {status}
                      </Badge>
                    </Td>
                    <Td>{formatDate(f.UpdatedAt || f.CreatedAt)}</Td>
                    <Td>
                      {action ? (
                        <Button
                          variant={action.target === "Built" ? "primary" : "secondary"}
                          loading={busy}
                          onClick={() => onActionClick(order, action)}
                        >
                          {action.label}
                        </Button>
                      ) : (
                        <Text as="span" color="colorTextWeak">
                          —
                        </Text>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </Card>
      </Stack>

      <Modal
        isOpen={isModalOpen}
        onDismiss={() => setIsModalOpen(false)}
        size="default"
        ariaLabelledby="advance-modal-heading"
      >
        <ModalHeader>
          <ModalHeading as="h3" id="advance-modal-heading">
            {selected?.target === "Delivered"
              ? "Confirmar entrega al cliente"
              : "Confirmar Builder listo"}
          </ModalHeading>
        </ModalHeader>
        <ModalBody>
          {selected?.target === "Delivered" ? (
            <>
              Vas a marcar la orden #{selected?.order.fields.OrderId} como{" "}
              <strong>Delivered</strong>. Se enviará un WhatsApp al cliente
              confirmando la entrega. Confirma solo si ya recibió su Builder.
            </>
          ) : (
            <>
              Vas a marcar la orden #{selected?.order.fields.OrderId} como{" "}
              <strong>Built</strong>. Se enviará un WhatsApp al cliente
              avisándole que su Builder está listo para recoger. Confirma solo
              si tienes el Builder físicamente listo para entregar.
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <ModalFooterActions>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmAdvance} loading={busy}>
              {selected?.target === "Delivered" ? "Confirmar entrega" : "Confirmar"}
            </Button>
          </ModalFooterActions>
        </ModalFooter>
      </Modal>
    </Box>
  );
}

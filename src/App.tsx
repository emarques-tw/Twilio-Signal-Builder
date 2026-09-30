import { useEffect, useState, useCallback, useRef } from "react";
import { Box } from "@twilio-paste/core/box";
import { Stack } from "@twilio-paste/core/stack";
import { Toaster, useToaster } from "@twilio-paste/core/toast";
import { Label } from "@twilio-paste/core/label";
import { Select, Option } from "@twilio-paste/core/select";
import { LogoTwilioIcon } from "@twilio-paste/icons/esm/LogoTwilioIcon";
import { getSecret, clearSecret, listOrders, OrderRecord } from "./api";
import { LoginGate } from "./LoginGate";
import { OrderTable } from "./OrderTable";

const REFRESH_OPTIONS: Array<{ label: string; seconds: number }> = [
  { label: "Off", seconds: 0 },
  { label: "15 s", seconds: 15 },
  { label: "30 s", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "5 min", seconds: 300 },
];

const DEFAULT_INTERVAL = 60;

export function App() {
  const [authed, setAuthed] = useState<boolean>(!!getSecret());
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshSeconds, setRefreshSeconds] = useState<number>(DEFAULT_INTERVAL);
  const toaster = useToaster();
  const toasterRef = useRef(toaster);
  toasterRef.current = toaster;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const records = await listOrders();
      setOrders(records);
    } catch (err) {
      if ((err as Error).name === "UnauthorizedError") {
        setAuthed(false);
      } else {
        toasterRef.current.push({
          variant: "error",
          message: `Error al cargar las órdenes: ${(err as Error).message}`,
          dismissAfter: 6000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) void refresh();
  }, [authed, refresh]);

  useEffect(() => {
    if (!authed || refreshSeconds <= 0) return;
    const id = window.setInterval(() => {
      void refresh();
    }, refreshSeconds * 1000);
    return () => window.clearInterval(id);
  }, [authed, refresh, refreshSeconds]);

  if (!authed) {
    return <LoginGate onAuthenticated={() => setAuthed(true)} />;
  }

  return (
    <Box backgroundColor="colorBackgroundBody" minHeight="100vh">
      <Toaster {...toaster} />
      <Box
        backgroundColor="colorBackground"
        padding="space60"
        borderBottomWidth="borderWidth10"
        borderBottomStyle="solid"
        borderBottomColor="colorBorderWeaker"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack orientation="horizontal" spacing="space40">
            <LogoTwilioIcon color="colorTextIcon" decorative size="sizeIcon60" />
            <h1 style={{ margin: 0 }}>Builder MX &mdash; SIGNAL México</h1>
          </Stack>
          <Stack orientation="horizontal" spacing="space40">
            <Box display="flex" alignItems="center" columnGap="space30">
              <Label htmlFor="autorefresh" marginBottom="space0">
                Auto-actualizar
              </Label>
              <Box width="120px">
                <Select
                  id="autorefresh"
                  value={String(refreshSeconds)}
                  onChange={(e) => setRefreshSeconds(Number(e.target.value))}
                >
                  {REFRESH_OPTIONS.map((opt) => (
                    <Option key={opt.seconds} value={String(opt.seconds)}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Box>
            </Box>
            <button
              type="button"
              onClick={() => {
                clearSecret();
                setAuthed(false);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#606b85",
                fontSize: 14,
              }}
            >
              Cerrar sesión
            </button>
          </Stack>
        </Box>
      </Box>

      <OrderTable
        orders={orders ?? []}
        loading={loading}
        onRefresh={refresh}
        onActionComplete={(msg) => {
          toaster.push({ message: msg, variant: "success", dismissAfter: 4000 });
          void refresh();
        }}
        onActionError={(msg) => {
          toaster.push({ message: msg, variant: "error", dismissAfter: 6000 });
        }}
      />
    </Box>
  );
}

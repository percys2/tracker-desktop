import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Navigation, Loader2, CheckCircle, XCircle, ClipboardList, ShoppingCart, User } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Salesperson {
  id: number
  name: string
  phone: string | null
  email: string | null
  latitude: number | null
  longitude: number | null
  status: string
  last_updated: string | null
}

interface Visit {
  id: number
  salesperson_id: number
  salesperson_name: string
  client_name: string
  address: string | null
  visit_type: string
  status: string
  created_at: string
}

interface Order {
  id: number
  salesperson_id: number
  salesperson_name: string
  client_name: string
  products: string | null
  total_amount: number
  status: string
  created_at: string
}

function MobileTracker() {
  const [salespeople, setSalespeople] = useState<Salesperson[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [isTracking, setIsTracking] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'location' | 'visits' | 'orders'>('location')
  
  // Visits state
  const [myVisits, setMyVisits] = useState<Visit[]>([])
  const [visitForm, setVisitForm] = useState({
    client_name: '',
    address: '',
    visit_type: 'visit',
    notes: ''
  })
  
  // Orders state
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [orderForm, setOrderForm] = useState({
    client_name: '',
    products: '',
    total_amount: ''
  })

  useEffect(() => {
    fetchSalespeople()
  }, [])
  
  useEffect(() => {
    if (selectedId) {
      fetchMyVisits()
      fetchMyOrders()
    }
  }, [selectedId])

  const fetchSalespeople = async () => {
    try {
      const response = await fetch(`${API_URL}/api/salespeople`)
      const data = await response.json()
      setSalespeople(data.filter((p: Salesperson) => p.status === 'active'))
    } catch (error) {
      console.error('Error fetching salespeople:', error)
      setMessage('Error al cargar vendedores')
    }
  }
  
  const fetchMyVisits = async () => {
    try {
      const response = await fetch(`${API_URL}/api/visits`)
      const data = await response.json()
      setMyVisits(data.filter((v: Visit) => v.salesperson_id.toString() === selectedId))
    } catch (error) {
      console.error('Error fetching visits:', error)
    }
  }
  
  const fetchMyOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`)
      const data = await response.json()
      setMyOrders(data.filter((o: Order) => o.salesperson_id.toString() === selectedId))
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const sendLocation = async (latitude: number, longitude: number) => {
    if (!selectedId) return
    
    try {
      const response = await fetch(`${API_URL}/api/salespeople/${selectedId}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude })
      })
      
      if (response.ok) {
        setStatus('success')
        setMessage(`Ubicación enviada: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        setCurrentLocation({ lat: latitude, lng: longitude })
      } else {
        setStatus('error')
        setMessage('Error al enviar ubicación')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Error de conexión')
    }
  }

  const startTracking = () => {
    if (!selectedId) {
      setMessage('Seleccione un vendedor primero')
      return
    }

    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('Geolocalización no soportada en este navegador')
      return
    }

    setIsTracking(true)
    setStatus('loading')
    setMessage('Obteniendo ubicación...')

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        sendLocation(latitude, longitude)
      },
      (error) => {
        setStatus('error')
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setMessage('Permiso de ubicación denegado. Por favor habilite el GPS.')
            break
          case error.POSITION_UNAVAILABLE:
            setMessage('Ubicación no disponible')
            break
          case error.TIMEOUT:
            setMessage('Tiempo de espera agotado')
            break
          default:
            setMessage('Error al obtener ubicación')
        }
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    setWatchId(id)
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
    setStatus('idle')
    setMessage('Seguimiento detenido')
  }

  const sendSingleLocation = () => {
    if (!selectedId) {
      setMessage('Seleccione un vendedor primero')
      return
    }

    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('Geolocalización no soportada en este navegador')
      return
    }

    setStatus('loading')
    setMessage('Obteniendo ubicación...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        sendLocation(latitude, longitude)
      },
      (error) => {
        setStatus('error')
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setMessage('Permiso de ubicación denegado. Por favor habilite el GPS.')
            break
          case error.POSITION_UNAVAILABLE:
            setMessage('Ubicación no disponible')
            break
          case error.TIMEOUT:
            setMessage('Tiempo de espera agotado')
            break
          default:
            setMessage('Error al obtener ubicación')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }
  
  const handleAddVisit = async () => {
    if (!selectedId || !visitForm.client_name) {
      setMessage('Complete los campos requeridos')
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/api/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesperson_id: parseInt(selectedId),
          client_name: visitForm.client_name,
          address: visitForm.address || null,
          notes: visitForm.notes || null,
          visit_type: visitForm.visit_type
        })
      })
      
      if (response.ok) {
        setMessage('Visita registrada exitosamente')
        setStatus('success')
        setVisitForm({ client_name: '', address: '', visit_type: 'visit', notes: '' })
        fetchMyVisits()
      } else {
        setMessage('Error al registrar visita')
        setStatus('error')
      }
    } catch (error) {
      setMessage('Error de conexión')
      setStatus('error')
    }
  }
  
  const handleAddOrder = async () => {
    if (!selectedId || !orderForm.client_name) {
      setMessage('Complete los campos requeridos')
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesperson_id: parseInt(selectedId),
          client_name: orderForm.client_name,
          products: orderForm.products || null,
          total_amount: orderForm.total_amount ? parseFloat(orderForm.total_amount) : 0
        })
      })
      
      if (response.ok) {
        setMessage('Pedido registrado exitosamente')
        setStatus('success')
        setOrderForm({ client_name: '', products: '', total_amount: '' })
        fetchMyOrders()
      } else {
        setMessage('Error al registrar pedido')
        setStatus('error')
      }
    } catch (error) {
      setMessage('Error de conexión')
      setStatus('error')
    }
  }
  
  const handleCompleteVisit = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/visits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      fetchMyVisits()
      setMessage('Visita completada')
      setStatus('success')
    } catch (error) {
      setMessage('Error al completar visita')
      setStatus('error')
    }
  }
  
  const handleCompleteOrder = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      fetchMyOrders()
      setMessage('Pedido completado')
      setStatus('success')
    } catch (error) {
      setMessage('Error al completar pedido')
      setStatus('error')
    }
  }

  const selectedPerson = salespeople.find(p => p.id.toString() === selectedId)
  const todayVisits = myVisits.filter(v => {
    const today = new Date().toDateString()
    return new Date(v.created_at).toDateString() === today
  })
  const todayOrders = myOrders.filter(o => {
    const today = new Date().toDateString()
    return new Date(o.created_at).toDateString() === today
  })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #1a1a2e, #16213e)', padding: '16px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', color: 'white', marginBottom: '16px' }}>
          <MapPin style={{ height: '48px', width: '48px', margin: '0 auto 8px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Panel del Vendedor</h1>
          <p style={{ color: '#9ca3af', margin: '4px 0 0' }}>Nicaragua</p>
        </div>

        {/* Vendor Selection */}
        <Card style={{ marginBottom: '16px' }}>
          <CardHeader style={{ paddingBottom: '8px' }}>
            <CardTitle style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User style={{ height: '20px', width: '20px' }} />
              Selecciona tu nombre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={isTracking}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar vendedor" />
              </SelectTrigger>
              <SelectContent>
                {salespeople.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPerson && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                Conectado como: {selectedPerson.name}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        {selectedId && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => setActiveTab('location')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'location' ? '#10b981' : '#374151',
                color: 'white',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <MapPin style={{ height: '18px', width: '18px' }} />
              GPS
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'visits' ? '#10b981' : '#374151',
                color: 'white',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ClipboardList style={{ height: '18px', width: '18px' }} />
              Visitas
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'orders' ? '#10b981' : '#374151',
                color: 'white',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ShoppingCart style={{ height: '18px', width: '18px' }} />
              Pedidos
            </button>
          </div>
        )}

        {/* Location Tab */}
        {selectedId && activeTab === 'location' && (
          <>
            <Card style={{ marginBottom: '16px' }}>
              <CardContent style={{ paddingTop: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {!isTracking ? (
                    <>
                      <Button 
                        style={{ width: '100%', height: '56px', fontSize: '16px' }}
                        onClick={sendSingleLocation}
                        disabled={!selectedId || status === 'loading'}
                      >
                        {status === 'loading' ? (
                          <Loader2 style={{ height: '24px', width: '24px', marginRight: '8px' }} className="animate-spin" />
                        ) : (
                          <MapPin style={{ height: '24px', width: '24px', marginRight: '8px' }} />
                        )}
                        Enviar Ubicación Ahora
                      </Button>
                      
                      <Button 
                        style={{ width: '100%', height: '56px', fontSize: '16px', backgroundColor: '#10b981' }}
                        onClick={startTracking}
                        disabled={!selectedId || status === 'loading'}
                      >
                        <Navigation style={{ height: '24px', width: '24px', marginRight: '8px' }} />
                        Iniciar Seguimiento Continuo
                      </Button>
                    </>
                  ) : (
                    <Button 
                      style={{ width: '100%', height: '56px', fontSize: '16px', backgroundColor: '#ef4444' }}
                      onClick={stopTracking}
                    >
                      <XCircle style={{ height: '24px', width: '24px', marginRight: '8px' }} />
                      Detener Seguimiento
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {currentLocation && (
              <Card style={{ marginBottom: '16px' }}>
                <CardHeader style={{ paddingBottom: '8px' }}>
                  <CardTitle style={{ fontSize: '14px', color: '#6b7280' }}>Última ubicación enviada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                    Lat: {currentLocation.lat.toFixed(6)}<br />
                    Lng: {currentLocation.lng.toFixed(6)}
                  </p>
                </CardContent>
              </Card>
            )}

            {isTracking && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  backgroundColor: '#10b981', 
                  color: 'white', 
                  padding: '8px 16px', 
                  borderRadius: '9999px' 
                }}>
                  <div style={{ height: '12px', width: '12px', backgroundColor: 'white', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                  Enviando ubicación en tiempo real...
                </div>
              </div>
            )}
          </>
        )}

        {/* Visits Tab */}
        {selectedId && activeTab === 'visits' && (
          <>
            <Card style={{ marginBottom: '16px' }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '16px' }}>Registrar Nueva Visita</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <Label htmlFor="visit-client">Cliente *</Label>
                    <Input 
                      id="visit-client"
                      value={visitForm.client_name} 
                      onChange={e => setVisitForm({...visitForm, client_name: e.target.value})}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="visit-address">Dirección</Label>
                    <Input 
                      id="visit-address"
                      value={visitForm.address} 
                      onChange={e => setVisitForm({...visitForm, address: e.target.value})}
                      placeholder="Dirección del cliente"
                    />
                  </div>
                  <div>
                    <Label>Tipo de Visita</Label>
                    <Select value={visitForm.visit_type} onValueChange={v => setVisitForm({...visitForm, visit_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visit">Visita</SelectItem>
                        <SelectItem value="delivery">Entrega</SelectItem>
                        <SelectItem value="collection">Cobro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddVisit} disabled={!visitForm.client_name}>
                    <ClipboardList style={{ height: '18px', width: '18px', marginRight: '8px' }} />
                    Registrar Visita
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle style={{ fontSize: '16px' }}>Mis Visitas de Hoy ({todayVisits.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {todayVisits.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No hay visitas registradas hoy</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {todayVisits.map(visit => (
                      <div key={visit.id} style={{ 
                        padding: '12px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontWeight: 500, margin: 0 }}>{visit.client_name}</p>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                              {visit.visit_type === 'visit' ? 'Visita' : visit.visit_type === 'delivery' ? 'Entrega' : 'Cobro'}
                              {visit.address && ` - ${visit.address}`}
                            </p>
                          </div>
                          {visit.status !== 'completed' ? (
                            <Button size="sm" onClick={() => handleCompleteVisit(visit.id)}>
                              <CheckCircle style={{ height: '16px', width: '16px' }} />
                            </Button>
                          ) : (
                            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 500 }}>Completada</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Orders Tab */}
        {selectedId && activeTab === 'orders' && (
          <>
            <Card style={{ marginBottom: '16px' }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '16px' }}>Registrar Nuevo Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <Label htmlFor="order-client">Cliente *</Label>
                    <Input 
                      id="order-client"
                      value={orderForm.client_name} 
                      onChange={e => setOrderForm({...orderForm, client_name: e.target.value})}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="order-products">Productos</Label>
                    <Input 
                      id="order-products"
                      value={orderForm.products} 
                      onChange={e => setOrderForm({...orderForm, products: e.target.value})}
                      placeholder="Ej: 2x Producto A, 1x Producto B"
                    />
                  </div>
                  <div>
                    <Label htmlFor="order-total">Monto Total (C$)</Label>
                    <Input 
                      id="order-total"
                      type="number"
                      step="0.01"
                      value={orderForm.total_amount} 
                      onChange={e => setOrderForm({...orderForm, total_amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <Button onClick={handleAddOrder} disabled={!orderForm.client_name}>
                    <ShoppingCart style={{ height: '18px', width: '18px', marginRight: '8px' }} />
                    Registrar Pedido
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle style={{ fontSize: '16px' }}>Mis Pedidos de Hoy ({todayOrders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {todayOrders.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No hay pedidos registrados hoy</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {todayOrders.map(order => (
                      <div key={order.id} style={{ 
                        padding: '12px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontWeight: 500, margin: 0 }}>{order.client_name}</p>
                            {order.products && (
                              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{order.products}</p>
                            )}
                            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981', margin: '4px 0 0' }}>
                              C${order.total_amount.toFixed(2)}
                            </p>
                          </div>
                          {order.status !== 'completed' ? (
                            <Button size="sm" onClick={() => handleCompleteOrder(order.id)}>
                              <CheckCircle style={{ height: '16px', width: '16px' }} />
                            </Button>
                          ) : (
                            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 500 }}>Completado</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Status Message */}
        {message && (
          <Card style={{ 
            marginTop: '16px',
            borderColor: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#e5e7eb'
          }}>
            <CardContent style={{ paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {status === 'success' && <CheckCircle style={{ height: '20px', width: '20px', color: '#10b981' }} />}
                {status === 'error' && <XCircle style={{ height: '20px', width: '20px', color: '#ef4444' }} />}
                {status === 'loading' && <Loader2 style={{ height: '20px', width: '20px', color: '#3b82f6' }} className="animate-spin" />}
                <p style={{ 
                  fontSize: '14px', 
                  margin: 0,
                  color: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#6b7280'
                }}>
                  {message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Not logged in message */}
        {!selectedId && (
          <Card>
            <CardContent style={{ paddingTop: '24px', textAlign: 'center' }}>
              <User style={{ height: '48px', width: '48px', color: '#9ca3af', margin: '0 auto 12px' }} />
              <p style={{ color: '#6b7280' }}>Selecciona tu nombre para comenzar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default MobileTracker

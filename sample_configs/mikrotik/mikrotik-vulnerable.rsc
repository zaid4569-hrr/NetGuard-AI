# ==============================================================================
# NetGuard AI Synthetic Lab Configuration (Intentionally Vulnerable RouterOS)
# WARNING: FOR AUDIT SIMULATION ONLY — NOT FOR PRODUCTION USE
# ==============================================================================
# mar/04/2026 12:00:00 by RouterOS 7.12
# software id = LAB-NETGUARD
#
/interface ethernet
set [ find default-name=ether1 ] name=ether1-wan
set [ find default-name=ether2 ] name=ether2-lan

/system identity
set name=MikroTik-Lab-Router-01

/user
add name=admin group=full password=""

/ip address
add address=192.0.2.1/24 interface=ether1-wan network=192.0.2.0
add address=10.0.0.1/24 interface=ether2-lan network=10.0.0.0

/ip service
set telnet disabled=no port=23
set ftp disabled=no port=21
set www disabled=no port=80
set ssh disabled=no port=22
set www-ssl disabled=yes

/snmp
set enabled=yes
/snmp community
set [ find default=yes ] name=public

/ip firewall filter
add action=accept chain=forward comment="Permit all forward traffic"
add action=accept chain=input comment="Permit all input traffic"

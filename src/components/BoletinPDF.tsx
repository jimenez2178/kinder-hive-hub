"use client";

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#002147',
        paddingBottom: 20,
        marginBottom: 30,
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 60,
        objectFit: 'contain',
    },
    headerText: {
        marginLeft: 20,
        flex: 1,
    },
    title: {
        fontSize: 18,
        color: '#002147',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 8,
        color: '#64748b',
        fontWeight: 'bold',
        marginTop: 4,
        letterSpacing: 1,
    },
    period: {
        fontSize: 10,
        color: '#002147',
        marginTop: 8,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 10,
        backgroundColor: '#f1f5f9',
        padding: 6,
        color: '#002147',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 15,
        borderRadius: 4,
    },
    studentInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    infoBlock: {
        flex: 1,
    },
    label: {
        fontSize: 7,
        color: '#94a3b8',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    value: {
        fontSize: 10,
        color: '#1e293b',
        fontWeight: 'bold',
    },
    table: {
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#002147',
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        padding: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        padding: 8,
        fontSize: 9,
    },
    colSubject: { width: '50%' },
    colGrade: { width: '25%', textAlign: 'center' },
    colStatus: { width: '25%', textAlign: 'center' },
    attendanceSection: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 15,
    },
    attendanceCard: {
        flex: 1,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        alignItems: 'center',
    },
    attendanceValue: {
        fontSize: 20,
        color: '#002147',
        fontWeight: 'bold',
    },
    observations: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#fffbeb',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fef3c7',
        minHeight: 100,
    },
    obsText: {
        fontSize: 9,
        color: '#92400e',
        fontStyle: 'italic',
        lineHeight: 1.5,
    },
    footerContainer: {
        marginTop: 'auto',
        paddingTop: 40,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 25,
    },
    signatureBlock: {
        alignItems: 'center',
        width: 150,
    },
    signatureLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#002147',
        marginBottom: 5,
    },
    signatureName: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#002147',
    },
    signatureTitle: {
        fontSize: 7,
        color: '#64748b',
    },
    qrBlock: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrImage: {
        width: 50,
        height: 50,
        backgroundColor: '#002147',
        borderRadius: 4,
    },
    qrLabel: {
        fontSize: 6,
        color: '#94a3b8',
        marginTop: 4,
        fontWeight: 'bold',
    }
});

interface BoletinProps {
    alumno: string;
    grado: string;
    maestra: string;
    mes: string;
    ano: string;
    calificaciones: { asignatura: string, nota: number }[];
    asistencia: { presentes: number, ausentes: number };
    observaciones: string;
}

export const BoletinPDF = ({ alumno, grado, maestra, mes, ano, calificaciones, asistencia, observaciones }: BoletinProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Image 
                    src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png" 
                    style={styles.logo} 
                />
                <View style={styles.headerText}>
                    <Text style={styles.title}>Pre-escolar Sagrada Familia</Text>
                    <Text style={styles.subtitle}>SISTEMA DE EXCELENCIA ACADÉMICA OXFORD</Text>
                    <Text style={styles.period}>REPORTE DE PROGRESO MENSUAL — {mes.toUpperCase()} {ano}</Text>
                </View>
            </View>

            {/* Alumno Info */}
            <View style={styles.studentInfo}>
                <View style={styles.infoBlock}>
                    <Text style={styles.label}>Estudiante</Text>
                    <Text style={styles.value}>{alumno}</Text>
                </View>
                <View style={styles.infoBlock}>
                    <Text style={styles.label}>Grado / Curso</Text>
                    <Text style={styles.value}>{grado}</Text>
                </View>
                <View style={styles.infoBlock}>
                    <Text style={styles.label}>Docente a Cargo</Text>
                    <Text style={styles.value}>{maestra}</Text>
                </View>
            </View>

            {/* Calificaciones */}
            <Text style={styles.sectionTitle}>Evaluación de Competencias Académicas</Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colSubject}>Asignatura / Ámbito de Aprendizaje</Text>
                    <Text style={styles.colGrade}>Puntaje</Text>
                    <Text style={styles.colStatus}>Nivel</Text>
                </View>
                {calificaciones.length > 0 ? calificaciones.map((c, i) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={styles.colSubject}>{c.asignatura}</Text>
                        <Text style={styles.colGrade}>{c.nota}</Text>
                        <Text style={styles.colStatus}>{c.nota >= 70 ? 'LOGRADO' : 'EN PROCESO'}</Text>
                    </View>
                )) : (
                    <View style={styles.tableRow}>
                        <Text style={{ ...styles.colSubject, width: '100%', textAlign: 'center', color: '#94a3b8' }}>
                            No hay calificaciones registradas para este periodo.
                        </Text>
                    </View>
                )}
            </View>

            {/* Asistencia */}
            <Text style={styles.sectionTitle}>Control de Asistencia del Mensual</Text>
            <View style={styles.attendanceSection}>
                <View style={styles.attendanceCard}>
                    <Text style={styles.label}>Días Presentes</Text>
                    <Text style={styles.attendanceValue}>{asistencia.presentes}</Text>
                </View>
                <View style={styles.attendanceCard}>
                    <Text style={styles.label}>Días Ausentes</Text>
                    <Text style={styles.attendanceValue}>{asistencia.ausentes}</Text>
                </View>
                <View style={styles.attendanceCard}>
                    <Text style={styles.label}>Tasa de Asistencia</Text>
                    <Text style={{ ...styles.attendanceValue, color: '#10B981' }}>
                        {Math.round((asistencia.presentes / (asistencia.presentes + asistencia.ausentes || 1)) * 100)}%
                    </Text>
                </View>
            </View>

            {/* Observaciones */}
            <Text style={styles.sectionTitle}>Observaciones Pedagógicas Sugeridas</Text>
            <View style={styles.observations}>
                <Text style={styles.obsText}>
                    {observaciones || "Durante este periodo, el estudiante ha mostrado un comportamiento excelente y una gran disposición para el aprendizaje. Ha alcanzado los objetivos propuestos en las áreas fundamentales. Se recomienda continuar con el apoyo en las actividades de motricidad fina."}
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
                <View style={styles.footer}>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>Lourdes de Jiménez</Text>
                        <Text style={styles.signatureTitle}>Directora Académica</Text>
                    </View>
                    
                    <View style={styles.qrBlock}>
                        <View style={styles.qrImage} />
                        <Text style={styles.qrLabel}>ID: KH-BOL-2026</Text>
                    </View>
                    
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>Titular Encargada</Text>
                        <Text style={styles.signatureTitle}>{maestra}</Text>
                    </View>
                </View>
                <Text style={{ fontSize: 6, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>
                    Este boletín es un documento oficial emitido digitalmente por Kinder Hive Hub. Todos los derechos reservados © 2026.
                </Text>
            </View>
        </Page>
    </Document>
);

#!/usr/bin/env python3
"""Independently recompute and validate every answer in the EE question bank."""

from __future__ import annotations

import csv
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


PACKAGE_DIR = Path(__file__).resolve().parents[1]
QUESTION_CSV = PACKAGE_DIR / "question_database.csv"
REPORT_JSON = PACKAGE_DIR / "fact_check_report.json"
FAILURES_CSV = PACKAGE_DIR / "fact_check_failures.csv"
FORMULA_CSV = PACKAGE_DIR / "formula_catalog.csv"

K_COULOMB = 8.9875517923e9
EPSILON_0 = 8.8541878128e-12

PREFIX_RE = re.compile(r"^EE-\d+\s+\[Level\s+\d+,\s+Node\s+\d+\]:\s*")
NUMBER_RE = re.compile(r"(?<![A-Za-z])[-+]?\d+(?:\.\d+)?")
ANSWER_NUMBER_RE = re.compile(r"[-+]?\d+(?:\.\d+)?")


@dataclass(frozen=True)
class FormulaResult:
    value: float | None
    unit: str
    formula: str
    assumptions: str
    parameters: str
    text_answer: str | None = None


FORMULA_METADATA: dict[str, tuple[str, str]] = {
    "DC-01": ("I = V/R", "Ideal resistor; DC steady state."),
    "DC-02": ("Req = R1 + R2 + R3", "Only the stated series resistors are present."),
    "DC-03": ("Req = R1 R2/(R1 + R2)", "Two ideal resistors in parallel."),
    "DC-04": ("Vout = Vs Rbottom/(Rtop + Rbottom)", "Divider output is unloaded."),
    "DC-05": ("P = I^2 R", "Ideal resistor at the stated current."),
    "AC-01": ("Vrms = Vpeak/sqrt(2)", "Sinusoidal steady state; magnitude only."),
    "AC-02": ("|ZL| = 2 pi f L", "Ideal inductor."),
    "AC-03": ("|ZC| = 1/(2 pi f C)", "Ideal capacitor."),
    "AC-04": ("|Z| = sqrt(R^2 + X^2)", "Rectangular impedance components."),
    "AC-05": ("f0 = 1/(2 pi sqrt(LC))", "Ideal series RLC resonance."),
    "NT-01": ("IN = Vth/Rth", "Linear Thevenin/Norton source equivalence."),
    "NT-02": ("RL = Rth", "Purely resistive DC maximum-power condition."),
    "NT-03": ("Pmax = Vth^2/(4 Rth)", "Load is matched to a resistive Thevenin source."),
    "NT-04": ("IS = VS/R", "Ideal source transformation."),
    "NT-05": ("AD - BC = 1", "ABCD convention stated in the question."),
    "TR-01": ("tau = RC", "First-order ideal RC circuit."),
    "TR-02": ("vc/Vs = 1 - exp(-t/tau)", "Zero initial voltage; DC step input."),
    "TR-03": ("i/(Vs/R) = 1 - exp(-t/tau)", "Zero initial current; DC step input."),
    "TR-04": ("t/tau = -ln(1 - fraction)", "Zero initial voltage; first-order charging."),
    "TR-05": ("f0 = 1/(2 pi sqrt(LC))", "Ideal undamped LC tank."),
    "EM-01": ("F = k |q1 q2|/r^2", "Point charges in air, treated as vacuum."),
    "EM-02": ("E = V/d", "Uniform field; fringing neglected."),
    "EM-03": ("C = epsilon0 epsilonr A/d", "Parallel plates; fringing neglected."),
    "EM-04": ("H = I/(2 pi r)", "Infinitely long straight conductor."),
    "EM-05": ("|emf| = N |Delta Phi|/Delta t", "Uniform linear flux change; magnitude requested."),
    "TL-01": ("Z0 = sqrt(L/C)", "Lossless transmission line."),
    "TL-02": ("GammaL = (ZL - Z0)/(ZL + Z0)", "Real positive load and lossless line."),
    "TL-03": ("VSWR = (1 + |Gamma|)/(1 - |Gamma|)", "0 <= |Gamma| < 1."),
    "TL-04": ("Zin = Z0^2/ZL", "Lossless line exactly one quarter wavelength long."),
    "TL-05": ("Zt = sqrt(Z0 RL)", "Real positive impedances at the design frequency."),
    "PS-01": ("P = sqrt(3) VL IL pf", "Balanced three-phase load; RMS line quantities."),
    "PS-02": ("IL = S/(sqrt(3) VL)", "Balanced three-phase load; RMS line voltage."),
    "PS-03": ("Q = S sqrt(1 - pf^2)", "Sinusoidal lagging load."),
    "PS-04": ("Zpu,new = Zpu,old * Sbase,new/Sbase,old", "Voltage base is unchanged."),
    "PS-05": ("Delta VLL ~= sqrt(3) I R", "Balanced feeder; reactance and angle effects neglected."),
    "TM-01": ("Vs/Vp = Ns/Np", "Ideal transformer."),
    "TM-02": ("Vp Ip = Vs Is", "Ideal transformer; RMS magnitudes."),
    "TM-03": ("eta = (Pin - Ploss)/Pin", "All losses are included in the stated total."),
    "TM-04": ("ns = 120 f/P", "Synchronous AC machine speed."),
    "TM-05": ("Eb = V - Ia Ra", "DC motor brush drop neglected."),
    "PE-01": ("Vo = D Vin", "Ideal buck converter in continuous conduction."),
    "PE-02": ("Vo = Vin/(1 - D)", "Ideal boost converter in continuous conduction."),
    "PE-03": ("D = Vo/Vin", "Ideal buck converter in continuous conduction."),
    "PE-04": ("Vavg = 2 Vpeak/pi", "Ideal full-wave rectifier; zero diode drop."),
    "PE-05": ("Delta IL = (Vin - Vo) D/(L fs)", "Ideal buck converter in continuous conduction."),
    "AE-01": ("Av = -Rf/Rin", "Ideal op-amp with negative feedback."),
    "AE-02": ("Av = 1 + Rf/Rg", "Ideal op-amp with negative feedback."),
    "AE-03": ("fc = 1/(2 pi RC)", "Single-pole ideal RC filter."),
    "AE-04": ("fp = 1/(2 pi Rf Cp)", "Single parasitic capacitance across the feedback resistor."),
    "AE-05": ("SRmin = 2 pi f Vpeak", "Sinusoidal output at the stated peak amplitude."),
    "SD-01": ("IC = beta IB", "BJT is in forward-active region."),
    "SD-02": ("I = (VS - VD)/R", "Constant-voltage diode model."),
    "SD-03": ("gm = 2 ID/Vov", "Long-channel square-law MOSFET in saturation."),
    "SD-04": ("IZ = (VS - VZ)/R", "No load; Zener is regulating at its stated voltage."),
    "SD-05": ("VT = 25.85 mV (T/300 K)", "Thermal voltage is scaled linearly from the stated reference."),
    "DL-01": ("states = 2^n", "Independent binary bits."),
    "DL-02": ("bits = ceil(log2 N)", "Fixed-length binary encoding."),
    "DL-03": (
        "count(A xor B xor Cin = 1 across five cases)",
        "Positive-logic full adder; five independent input triplets.",
    ),
    "DL-04": (
        "count(AB + ACin + BCin = 1 across five cases)",
        "Positive-logic full adder; five independent input triplets.",
    ),
    "DL-05": ("fmax ~= 1/(stages tpd)", "Uses the period >= total-delay approximation stated."),
    "SS-01": (
        "Nyquist rate = 2 fmax",
        "Ideal baseband signal supported on |f| <= fmax; practical sampling must exceed the theoretical rate.",
    ),
    "SS-02": (
        "Lout = M + N - 1",
        "Finite-duration linear convolution with nonzero endpoint samples.",
    ),
    "SS-03": ("Vrms = Vpeak/sqrt(2)", "Pure sinusoid."),
    "SS-04": (
        "f3dB = 1/(2 pi tau)",
        "Canonical low-pass H(s)=K/(1+s*tau); bandwidth is relative to DC gain.",
    ),
    "SS-05": ("H(1) = sum h[n] = 1/(1 - a)", "|a| < 1."),
    "CS-01": ("T(0) = K/(1 + K)", "Negative unity feedback; scalar DC forward gain."),
    "CS-02": ("ess = 1/(1 + Kp)", "Stable type-0 negative-unity-feedback system; unit step."),
    "CS-03": ("Ts,2% ~= 4/(zeta wn)", "Standard dominant underdamped second-order approximation."),
    "CS-04": ("PO = 100 exp(-zeta pi/sqrt(1-zeta^2))", "Standard underdamped second-order step response."),
    "CS-05": ("wd = wn sqrt(1-zeta^2)", "Underdamped second-order poles."),
    "CM-01": ("BWAM = 2 fm,max", "Conventional double-sideband AM."),
    "CM-02": ("BW ~= 2(Delta f + fm,max)", "Carson's-rule estimate."),
    "CM-03": ("C = B log2(1 + SNR)", "AWGN channel; SNR is linear."),
    "CM-04": ("dB = 10 log10(P2/P1)", "Power ratio."),
    "CM-05": ("Rb = Rs log2 M", "M is a power of two; coding overhead excluded."),
    "MI-01": ("LSB = Vref/2^N", "Ideal unipolar ADC using the stated quantization-step convention."),
    "MI-02": ("Vin ~= code Vref/2^N", "Ideal unipolar ADC using LSB = Vref/2^N."),
    "MI-03": ("|eq,max| = 0.5 Vref/2^N", "Ideal rounding quantizer."),
    "MI-04": ("Vm = Vs Rm/(Rs + Rm)", "Voltmeter represented by its input resistance."),
    "MI-05": ("Rx = R2 R3/R1", "Uses the bridge-arm ratio explicitly stated."),
    "PCB-01": ("tpd = length x delay_per_length", "Uniform trace."),
    "PCB-02": ("|XC| = 1/(2 pi f C)", "Ideal capacitor; ESR and ESL neglected."),
    "PCB-03": (
        "|V| = L |Delta I/Delta t|",
        "Linear current ramp over the stated transition time; magnitude requested.",
    ),
    "PCB-04": ("Rseries ~= Z0 - Rdriver", "Driver resistance is stated as negligible."),
    "PCB-05": ("BW ~= 0.35/tr", "Single-pole 10-90% rise-time approximation."),
    "ES-01": ("tbit = 1/baud", "One symbol per UART bit."),
    "ES-02": ("Toverflow = counts x prescaler/fclock", "Timer increments once per prescaled clock."),
    "ES-03": ("Vavg = D Vhigh + (1-D) Vlow", "Ideal PWM and averaging interval spans whole cycles."),
    "ES-04": (
        "t = Nbytes x 8 bits/byte / fSCLK",
        "Eight bits per byte; no inter-byte gaps.",
    ),
    "ES-05": ("Vin ~= code Vref/2^N", "Ideal unipolar ADC using LSB = Vref/2^N."),
    "RF-01": ("lambda = c/f", "Free space with c approximated as 300 Mm/s."),
    "RF-02": (
        "Ldipole = 0.95 c/(2 f)",
        "Thin half-wave dipole; c = 300 Mm/s and the stated 0.95 end-effect factor.",
    ),
    "RF-03": ("FSPL = 32.44 + 20 log10(fMHz) + 20 log10(dkm)", "Free-space far field; stated unit convention."),
    "RF-04": ("Glinear = 10^(GdBi/10)", "Power gain relative to isotropic."),
    "RF-05": ("N = -174 + 10 log10(BHz) + NF", "Room-temperature -174 dBm/Hz reference."),
    "SP-01": (
        "Is = Ip x Is,rated/Ip,rated",
        "Ideal current-transformer ratio; saturation and ratio error neglected.",
    ),
    "SP-02": ("Ifault = V/Zloop", "The stated voltage is across the complete fault loop."),
    "SP-03": ("E = 0.5 C V^2", "Ideal capacitor."),
    "SP-04": (
        "Ip,pickup = Is,pickup x Ip,rated/Is,rated",
        "Ideal current-transformer ratio.",
    ),
    "SP-05": ("P = I^2 R", "Steady RMS current and stated conductor resistance."),
}


def clean_question(question: str) -> str:
    return PREFIX_RE.sub("", question)


def numbers(question: str) -> list[float]:
    return [float(value) for value in NUMBER_RE.findall(clean_question(question))]


def exact_decimal_value(template_id: str, question: str) -> Decimal | None:
    d = [Decimal(value) for value in NUMBER_RE.findall(clean_question(question))]
    two = Decimal(2)
    thousand = Decimal(1000)

    if template_id == "MI-01":
        return d[1] / (two ** int(d[0])) * thousand
    if template_id == "MI-02":
        return d[2] * d[1] / (two ** int(d[0]))
    if template_id == "MI-03":
        return Decimal("0.5") * d[1] / (two ** int(d[0])) * thousand
    if template_id == "MI-04":
        return d[0] * d[2] / (d[1] + d[2])
    if template_id == "MI-05":
        return d[1] * d[2] / d[0]
    if template_id == "ES-05":
        return d[2] * d[1] / (two ** int(d[0]))
    if template_id == "ES-03":
        return d[2] * d[1] + (Decimal(1) - d[2]) * d[0]
    if template_id == "PE-03":
        return d[0] / d[1]
    if template_id == "EM-05":
        return d[0] * d[1] / d[2]
    if template_id == "RF-02":
        return d[-1] * (Decimal(300) / d[-2]) / two
    if template_id == "RF-01":
        return Decimal(300) / d[-1]
    if template_id == "SP-01":
        return d[2] * d[1] / d[0]
    if template_id == "SP-02":
        return d[0] / d[1]
    if template_id == "SP-03":
        return Decimal("0.5") * d[0] * Decimal("0.000001") * d[1] ** 2
    if template_id == "SP-04":
        return d[0] * d[1] / d[2]
    if template_id == "SP-05":
        return d[0] ** 2 * d[1]
    return None


def evaluate(template_id: str, question: str) -> FormulaResult:
    n = numbers(question)
    formula, assumptions = FORMULA_METADATA[template_id]
    value: float | None
    unit: str

    if template_id == "DC-01":
        value, unit = n[0] / n[1], "A"
    elif template_id == "DC-02":
        value, unit = sum(n[:3]), "ohm"
    elif template_id == "DC-03":
        value, unit = n[0] * n[1] / (n[0] + n[1]), "ohm"
    elif template_id == "DC-04":
        value, unit = n[2] * n[1] / (n[0] + n[1]), "V"
    elif template_id == "DC-05":
        value, unit = n[0] ** 2 * n[1], "W"
    elif template_id == "AC-01":
        value, unit = n[0] / math.sqrt(2), "V"
    elif template_id == "AC-02":
        value, unit = 2 * math.pi * n[0] * n[1] * 1e-3, "ohm"
    elif template_id == "AC-03":
        value, unit = 1 / (2 * math.pi * n[0] * n[1] * 1e-6), "ohm"
    elif template_id == "AC-04":
        match = re.search(r"Z\s*=\s*([-+]?\d+(?:\.\d+)?)\s*\+\s*j([-+]?\d+(?:\.\d+)?)", question)
        if not match:
            raise ValueError("could not parse rectangular impedance")
        value, unit = math.hypot(float(match.group(1)), float(match.group(2))), "ohm"
    elif template_id in {"AC-05", "TR-05"}:
        value, unit = 1 / (2 * math.pi * math.sqrt(n[0] * 1e-3 * n[1] * 1e-6)), "Hz"
    elif template_id in {"NT-01", "NT-04"}:
        value, unit = n[0] / n[1], "A"
    elif template_id == "NT-02":
        value, unit = n[0], "ohm"
    elif template_id == "NT-03":
        value, unit = n[0] ** 2 / (4 * n[1]), "W"
    elif template_id == "NT-05":
        determinant = n[0] * n[3] - n[1] * n[2]
        reciprocal = math.isclose(determinant, 1.0, abs_tol=0.01)
        text_answer = (
            "Reciprocal because AD - BC is approximately 1"
            if reciprocal
            else "Not reciprocal because AD - BC is not 1"
        )
        return FormulaResult(None, "", formula, assumptions, f"AD-BC={determinant:.6g}", text_answer)
    elif template_id == "TR-01":
        value, unit = n[0] * n[1], "ms"
    elif template_id == "TR-02":
        value, unit = n[1] * (1 - math.exp(-n[2])), "V"
    elif template_id == "TR-03":
        source_v, resistance, time_constants = n[-3:]
        value, unit = (source_v / resistance) * (1 - math.exp(-time_constants)), "A"
    elif template_id == "TR-04":
        value, unit = -math.log(1 - n[0] / 100), "tau"
    elif template_id == "EM-01":
        value, unit = K_COULOMB * n[0] * 1e-6 * n[1] * 1e-6 / n[2] ** 2, "N"
    elif template_id == "EM-02":
        value, unit = n[0] / (n[1] * 1e-3), "V/m"
    elif template_id == "EM-03":
        value, unit = EPSILON_0 * n[0] * n[1] * 1e-4 / (n[3] * 1e-3) * 1e12, "pF"
    elif template_id == "EM-04":
        value, unit = n[0] / (2 * math.pi * n[1] * 1e-2), "A/m"
    elif template_id == "EM-05":
        value, unit = n[0] * n[1] / n[2], "V"
    elif template_id == "TL-01":
        value, unit = math.sqrt(n[0] * 1e-9 / (n[1] * 1e-12)), "ohm"
    elif template_id == "TL-02":
        value, unit = (n[1] - n[0]) / (n[1] + n[0]), ""
    elif template_id == "TL-03":
        value, unit = (1 + n[0]) / (1 - n[0]), ""
    elif template_id == "TL-04":
        value, unit = n[0] ** 2 / n[1], "ohm"
    elif template_id == "TL-05":
        value, unit = math.sqrt(n[0] * n[1]), "ohm"
    elif template_id == "PS-01":
        value, unit = math.sqrt(3) * n[0] * n[1] * n[2], "kW"
    elif template_id == "PS-02":
        value, unit = n[0] * 1000 / (math.sqrt(3) * n[1]), "A"
    elif template_id == "PS-03":
        value, unit = n[0] * math.sqrt(1 - n[1] ** 2), "kVAr"
    elif template_id == "PS-04":
        value, unit = n[0] * n[2] / n[1], "pu"
    elif template_id == "PS-05":
        value, unit = math.sqrt(3) * n[0] * n[1], "V"
    elif template_id == "TM-01":
        value, unit = n[2] * n[1] / n[0], "V"
    elif template_id == "TM-02":
        value, unit = n[0] * n[2] / n[1], "A"
    elif template_id == "TM-03":
        value, unit = 100 * (n[0] - n[1]) / n[0], "%"
    elif template_id == "TM-04":
        value, unit = 120 * n[1] / n[0], "rpm"
    elif template_id == "TM-05":
        value, unit = n[0] - n[1] * n[2], "V"
    elif template_id == "PE-01":
        value, unit = n[0] * n[1], "V"
    elif template_id == "PE-02":
        value, unit = n[0] / (1 - n[1]), "V"
    elif template_id == "PE-03":
        value, unit = n[0] / n[1], ""
    elif template_id == "PE-04":
        value, unit = 2 * n[0] / math.pi, "V"
    elif template_id == "PE-05":
        duty = n[1] / n[0]
        value, unit = (n[0] - n[1]) * duty / (n[2] * 1e-6 * n[3] * 1e3), "A"
    elif template_id == "AE-01":
        value, unit = -n[1] / n[0], "V/V"
    elif template_id == "AE-02":
        value, unit = 1 + n[1] / n[0], "V/V"
    elif template_id == "AE-03":
        value, unit = 1 / (2 * math.pi * n[0] * 1e3 * n[1] * 1e-9), "Hz"
    elif template_id == "AE-04":
        value, unit = 1 / (2 * math.pi * n[0] * 1e3 * n[1] * 1e-12) / 1e6, "MHz"
    elif template_id == "AE-05":
        value, unit = 2 * math.pi * n[0] * 1e3 * n[1] / 1e6, "V/us"
    elif template_id == "SD-01":
        value, unit = n[0] * n[1] / 1000, "mA"
    elif template_id == "SD-02":
        value, unit = (n[2] - n[0]) / n[1] * 1000, "mA"
    elif template_id == "SD-03":
        value, unit = 2 * n[0] / n[1], "mS"
    elif template_id == "SD-04":
        value, unit = (n[1] - n[0]) / n[2] * 1000, "mA"
    elif template_id == "SD-05":
        value, unit = n[0] * n[2] / n[1], "mV"
    elif template_id == "DL-01":
        value, unit = 2 ** int(n[0]), "states"
    elif template_id == "DL-02":
        value, unit = math.ceil(math.log2(n[0])), "bits"
    elif template_id == "DL-03":
        bits = [int(value) for value in n[:15]]
        value = sum(bits[index] ^ bits[index + 1] ^ bits[index + 2] for index in range(0, 15, 3))
        unit = ""
    elif template_id == "DL-04":
        bits = [int(value) for value in n[:15]]
        value = sum(int(sum(bits[index : index + 3]) >= 2) for index in range(0, 15, 3))
        unit = ""
    elif template_id == "DL-05":
        value, unit = 1000 / (n[0] * n[1]), "MHz"
    elif template_id == "SS-01":
        value, unit = 2 * n[0], "kHz"
    elif template_id == "SS-02":
        value, unit = n[0] + n[1] - 1, "samples"
    elif template_id == "SS-03":
        value, unit = n[0] / math.sqrt(2), "V"
    elif template_id == "SS-04":
        value, unit = 1 / (2 * math.pi * n[0] * 1e-3), "Hz"
    elif template_id == "SS-05":
        value, unit = 1 / (1 - n[0]), ""
    elif template_id == "CS-01":
        value, unit = n[0] / (1 + n[0]), ""
    elif template_id == "CS-02":
        value, unit = 1 / (1 + n[1]), ""
    elif template_id == "CS-03":
        value, unit = 4 / (n[0] * n[1]), "s"
    elif template_id == "CS-04":
        value, unit = 100 * math.exp(-n[0] * math.pi / math.sqrt(1 - n[0] ** 2)), "%"
    elif template_id == "CS-05":
        value, unit = n[0] * math.sqrt(1 - n[1] ** 2), "rad/s"
    elif template_id == "CM-01":
        value, unit = 2 * n[0], "kHz"
    elif template_id == "CM-02":
        value, unit = 2 * (n[0] + n[1]), "kHz"
    elif template_id == "CM-03":
        value, unit = n[0] * math.log2(1 + n[1]), "Mbps"
    elif template_id == "CM-04":
        value, unit = 10 * math.log10(n[0]), "dB"
    elif template_id == "CM-05":
        value, unit = n[1] * math.log2(n[0]), "kb/s"
    elif template_id == "MI-01":
        value, unit = n[1] / (2 ** int(n[0])) * 1000, "mV"
    elif template_id == "MI-02":
        value, unit = n[2] * n[1] / (2 ** int(n[0])), "V"
    elif template_id == "MI-03":
        value, unit = 0.5 * n[1] / (2 ** int(n[0])) * 1000, "mV"
    elif template_id == "MI-04":
        value, unit = n[0] * n[2] / (n[1] + n[2]), "V"
    elif template_id == "MI-05":
        value, unit = n[1] * n[2] / n[0], "ohm"
    elif template_id == "PCB-01":
        value, unit = n[0] * n[1], "ps"
    elif template_id == "PCB-02":
        value, unit = 1 / (2 * math.pi * n[0] * 1e-9 * n[1] * 1e6), "ohm"
    elif template_id == "PCB-03":
        value, unit = n[0] * n[1] / n[2], "V"
    elif template_id == "PCB-04":
        value, unit = n[0], "ohm"
    elif template_id == "PCB-05":
        value, unit = 350 / n[2], "MHz"
    elif template_id == "ES-01":
        value, unit = 1e6 / n[0], "us"
    elif template_id == "ES-02":
        value, unit = n[2] * n[1] / (n[0] * 1e6) * 1000, "ms"
    elif template_id == "ES-03":
        value, unit = n[2] * n[1] + (1 - n[2]) * n[0], "V"
    elif template_id == "ES-04":
        value, unit = 8 * n[0] / n[1], "us"
    elif template_id == "ES-05":
        value, unit = n[2] * n[1] / (2 ** int(n[0])), "V"
    elif template_id == "RF-01":
        value, unit = 300 / n[-1], "m"
    elif template_id == "RF-02":
        value, unit = n[-1] * (300 / n[-2]) / 2, "m"
    elif template_id == "RF-03":
        value, unit = 32.44 + 20 * math.log10(n[0]) + 20 * math.log10(n[1]), "dB"
    elif template_id == "RF-04":
        value, unit = 10 ** (n[0] / 10), ""
    elif template_id == "RF-05":
        value, unit = -174 + 10 * math.log10(n[0] * 1000) + n[1], "dBm"
    elif template_id == "SP-01":
        value, unit = n[2] * n[1] / n[0], "A"
    elif template_id == "SP-02":
        value, unit = n[0] / n[1], "A"
    elif template_id == "SP-03":
        value, unit = 0.5 * n[0] * 1e-6 * n[1] ** 2, "J"
    elif template_id == "SP-04":
        value, unit = n[0] * n[1] / n[2], "A"
    elif template_id == "SP-05":
        value, unit = n[0] ** 2 * n[1], "W"
    else:
        raise KeyError(f"No evaluator for {template_id}")

    return FormulaResult(value, unit, formula, assumptions, ", ".join(f"{x:g}" for x in n))


def parse_display_number(value: str) -> tuple[float, int]:
    match = ANSWER_NUMBER_RE.search(value)
    if not match:
        raise ValueError(f"No numeric value in {value!r}")
    token = match.group(0)
    decimals = len(token.partition(".")[2])
    return float(token), decimals


def normalized_unit(value: str) -> str:
    return ANSWER_NUMBER_RE.sub("", value, count=1).strip().replace(" ", "")


def round_half_up(value: float | Decimal, decimals: int) -> float:
    quantum = Decimal("1").scaleb(-decimals)
    decimal_value = value if isinstance(value, Decimal) else Decimal(f"{value:.14g}")
    return float(decimal_value.quantize(quantum, rounding=ROUND_HALF_UP))


def rounded_matches(display: str, expected: float, decimals: int | None = None) -> bool:
    actual, display_decimals = parse_display_number(display)
    precision = display_decimals if decimals is None else decimals
    rounded = round_half_up(expected, precision)
    return math.isclose(actual, rounded, rel_tol=0, abs_tol=10 ** (-(precision + 6)))


def main() -> None:
    failures: list[dict[str, str]] = []
    topic_counts: Counter[str] = Counter()
    template_counts: Counter[str] = Counter()
    issue_counts: Counter[str] = Counter()
    correct_letters: Counter[str] = Counter()
    level_counts: Counter[int] = Counter()
    actual_difficulty_examples: defaultdict[int, list[str]] = defaultdict(list)
    row_count = 0

    with QUESTION_CSV.open(newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        required = {
            "question_id",
            "topic",
            "template_id",
            "question",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "option_e",
            "option_f",
            "correct_option",
            "correct_answer",
            "verification_value",
        }
        missing_columns = required - set(reader.fieldnames or [])
        if missing_columns:
            raise RuntimeError(f"Missing required columns: {sorted(missing_columns)}")

        for row in reader:
            row_count += 1
            question_id = row["question_id"]
            template_id = row["template_id"]
            topic_counts[row["topic"]] += 1
            template_counts[template_id] += 1
            correct_letters[row["correct_option"]] += 1
            level = int(row["difficulty_rank"])
            level_counts[level] += 1

            row_issues: list[str] = []
            try:
                result = evaluate(template_id, row["question"])
            except Exception as exc:
                row_issues.append(f"evaluation_error: {exc}")
                result = None

            option_map = {
                "A": row["option_a"],
                "B": row["option_b"],
                "C": row["option_c"],
                "D": row["option_d"],
                "E": row["option_e"],
                "F": row["option_f"],
            }
            keyed = option_map.get(row["correct_option"])
            if keyed is None:
                row_issues.append("invalid_correct_option")
            elif keyed != row["correct_answer"]:
                row_issues.append("correct_option_does_not_match_correct_answer")
            if row["verification_value"] != row["correct_answer"]:
                row_issues.append("verification_value_does_not_match_correct_answer")
            if len(set(option_map.values())) != 6:
                row_issues.append("duplicate_option_text")
            if any("Distractor" in option for option in option_map.values()):
                row_issues.append("placeholder_option_text")

            if result is not None and result.text_answer is not None:
                if row["correct_answer"] != result.text_answer:
                    row_issues.append(
                        f"text_answer_mismatch expected={result.text_answer!r} actual={row['correct_answer']!r}"
                    )
            elif result is not None and result.value is not None:
                try:
                    _, answer_decimals = parse_display_number(row["correct_answer"])
                    exact_value = exact_decimal_value(template_id, row["question"])
                    expected_value = exact_value if exact_value is not None else result.value
                    if not rounded_matches(row["correct_answer"], expected_value):
                        row_issues.append(
                            f"numeric_answer_mismatch expected={result.value:.12g} actual={row['correct_answer']!r}"
                        )
                except ValueError as exc:
                    row_issues.append(f"answer_parse_error: {exc}")

                answer_unit = normalized_unit(row["correct_answer"])
                expected_unit = result.unit.replace(" ", "")
                if answer_unit != expected_unit:
                    row_issues.append(
                        f"answer_unit_mismatch expected={result.unit!r} actual={answer_unit!r}"
                    )

                matching_options = []
                correct_numeric, _ = parse_display_number(row["correct_answer"])
                for letter, option in option_map.items():
                    try:
                        option_numeric, option_decimals = parse_display_number(option)
                        if option_decimals != answer_decimals:
                            row_issues.append(
                                f"option_precision_mismatch option={letter} "
                                f"expected={answer_decimals} actual={option_decimals}"
                            )
                        option_unit = normalized_unit(option)
                        if option_unit != expected_unit:
                            row_issues.append(
                                f"option_unit_mismatch option={letter} "
                                f"expected={expected_unit!r} actual={option_unit!r}"
                            )
                        if option_unit == expected_unit and math.isclose(
                            option_numeric,
                            correct_numeric,
                            rel_tol=0,
                            abs_tol=10 ** (-(answer_decimals + 6)),
                        ):
                            matching_options.append(letter)
                    except ValueError:
                        pass
                if matching_options != [row["correct_option"]]:
                    row_issues.append(
                        f"expected_value_option_count expected={[row['correct_option']]} actual={matching_options}"
                    )

            if level >= 20 and len(actual_difficulty_examples[level]) < 5:
                actual_difficulty_examples[level].append(question_id)

            if row_issues:
                for issue in row_issues:
                    issue_counts[issue.split(":", 1)[0].split(" ", 1)[0]] += 1
                failures.append(
                    {
                        "question_id": question_id,
                        "template_id": template_id,
                        "topic": row["topic"],
                        "difficulty_rank": row["difficulty_rank"],
                        "issues": " | ".join(row_issues),
                        "question": row["question"],
                        "correct_answer": row["correct_answer"],
                        "recomputed_value": "" if result is None or result.value is None else f"{result.value:.12g}",
                    }
                )

    formula_rows = []
    for template_id in sorted(FORMULA_METADATA):
        formula, assumptions = FORMULA_METADATA[template_id]
        formula_rows.append(
            {
                "template_id": template_id,
                "formula": formula,
                "assumptions": assumptions,
                "rows_checked": template_counts[template_id],
                "fact_check_method": "Independent deterministic recomputation from question givens",
            }
        )

    with FORMULA_CSV.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=formula_rows[0].keys())
        writer.writeheader()
        writer.writerows(formula_rows)

    failure_fields = [
        "question_id",
        "template_id",
        "topic",
        "difficulty_rank",
        "issues",
        "question",
        "correct_answer",
        "recomputed_value",
    ]
    with FAILURES_CSV.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=failure_fields)
        writer.writeheader()
        writer.writerows(failures)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "PASS" if not failures else "FAIL",
        "questions_checked": row_count,
        "templates_checked": len(template_counts),
        "formula_catalog_entries": len(formula_rows),
        "failed_questions": len(failures),
        "issue_counts": dict(issue_counts),
        "topic_counts": dict(topic_counts),
        "template_counts": dict(template_counts),
        "difficulty_level_counts": {str(k): v for k, v in sorted(level_counts.items())},
        "correct_option_distribution": dict(correct_letters),
        "checks": [
            {
                "name": "Independent numerical recomputation",
                "result": "PASS" if not failures else "FAIL",
                "details": f"Recomputed {row_count - len(failures)} of {row_count} rows without a discrepancy.",
            },
            {
                "name": "Template coverage",
                "result": "PASS" if set(template_counts) == set(FORMULA_METADATA) else "FAIL",
                "details": f"Validated {len(template_counts)} data templates against {len(FORMULA_METADATA)} formula rules.",
            },
            {
                "name": "Exactly one correct option",
                "result": "PASS" if not issue_counts.get("expected_value_option_count") else "FAIL",
                "details": "Each numeric answer must appear exactly once after applying its displayed rounding precision.",
            },
            {
                "name": "Answer-key consistency",
                "result": "PASS"
                if not issue_counts.get("correct_option_does_not_match_correct_answer")
                else "FAIL",
                "details": "The keyed option letter must point to the stored correct answer.",
            },
            {
                "name": "Unit consistency",
                "result": "PASS"
                if not issue_counts.get("answer_unit_mismatch")
                and not issue_counts.get("option_unit_mismatch")
                else "FAIL",
                "details": "Stored answer and all six option units must match the governing formula rule.",
            },
            {
                "name": "Uniform option precision",
                "result": "PASS" if not issue_counts.get("option_precision_mismatch") else "FAIL",
                "details": "All numeric options use the same decimal precision as the keyed answer.",
            },
            {
                "name": "Placeholder-free choices",
                "result": "PASS" if not issue_counts.get("placeholder_option_text") else "FAIL",
                "details": "No answer choice may contain production placeholder text.",
            },
            {
                "name": "ROUND_HALF_UP boundary fixture",
                "result": "PASS"
                if Decimal(str(round_half_up(Decimal("1.2345"), 3))) == Decimal("1.235")
                else "FAIL",
                "details": "Synthetic exact midpoint 1.2345 rounds to 1.235 at three decimal places.",
            },
        ],
        "methodology": [
            "Question givens are parsed from each stem and evaluated with a template-specific formula.",
            "The recomputed value is rounded to the same number of decimal places shown in each candidate option.",
            "The correct option must be the only option equal to the independently recomputed value at that precision.",
            "Formula assumptions are cataloged separately so idealizations are explicit and auditable.",
        ],
        "known_content_risk": {
            "difficulty_progression": (
                "Difficulty ranks are organizational levels; many high-rank rows remain single-step "
                "substitutions and should not be interpreted as a psychometrically calibrated measure."
            ),
            "high_level_examples": dict(actual_difficulty_examples),
        },
    }
    REPORT_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(
        f"Checked {row_count} questions across {len(template_counts)} templates: "
        f"{len(failures)} failed."
    )
    print(f"Report: {REPORT_JSON}")
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

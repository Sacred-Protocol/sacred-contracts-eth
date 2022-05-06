// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

library Pairing {
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    /*
     * @return The negation of p, i.e. p.plus(p.negate()) should be zero
     */
    function negate(G1Point memory p) internal pure returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        if (p.X == 0 && p.Y == 0) {
            return G1Point(0, 0);
        } else {
            return G1Point(p.X, PRIME_Q - (p.Y % PRIME_Q));
        }
    }

    /*
     * @return r the sum of two points of G1
     */
    function plus(
        G1Point memory p1,
        G1Point memory p2
    ) internal view returns (G1Point memory r) {
        uint256[4] memory input = [
            p1.X, p1.Y,
            p2.X, p2.Y
        ];
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success, "pairing-add-failed");
    }

    /*
     * @return r the product of a point on G1 and a scalar, i.e.
     *         p == p.scalarMul(1) and p.plus(p) == p.scalarMul(2) for all
     *         points p.
     */
    function scalarMul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
        uint256[3] memory input = [p.X, p.Y, s];
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success, "pairing-mul-failed");
    }

    /* @return The result of computing the pairing check
     *         e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
     *         For example,
     *         pairing([P1(), P1().negate()], [P2(), P2()]) should return true.
     */
    function pairing(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2,
        G1Point memory d1,
        G2Point memory d2
    ) internal view returns (bool) {
        uint256[24] memory input = [
            a1.X, a1.Y, a2.X[0], a2.X[1], a2.Y[0], a2.Y[1],
            b1.X, b1.Y, b2.X[0], b2.X[1], b2.Y[0], b2.Y[1],
            c1.X, c1.Y, c2.X[0], c2.X[1], c2.Y[0], c2.Y[1],
            d1.X, d1.Y, d2.X[0], d2.X[1], d2.Y[0], d2.Y[1]
        ];
        uint256[1] memory out;
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, input, mul(24, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success, "pairing-opcode-failed");
        return out[0] != 0;
    }
}

contract Verifier {
    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
    using Pairing for *;

    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[7] IC;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(uint256(21319828715501805369083478299296312268707688624392371715189749747934301976886), uint256(7075751588106346862968061466078032096364481862986616788417769258216859729925));
        vk.beta2 = Pairing.G2Point([uint256(7491930141116389898451232062082175006524927477931829070088802383527997871706), uint256(11645867074280589749191204371114330347805550394886484770840486558008119202093)], [uint256(9822273585043667053470147287458424784983564724691292310735901331083600158991), uint256(4668564564936726250404150668607370216371910282149474392608522091403630870643)]);
        vk.gamma2 = Pairing.G2Point([uint256(9333220218831783177509618794927471219229906345297818180974764883382706425479), uint256(21251337496446074684512973351167621890795826643789706351019627162549969838017)], [uint256(1579277903494891131382545211244064614258505225529865050538682580737498786113), uint256(9889813466913012791717438339986657160907853054272580044649024599294959699031)]);
        vk.delta2 = Pairing.G2Point([uint256(10366681292672413036012513150228832795603372237850211411817372694706587521712), uint256(9461592606816701418655911720622828060582523593985715417969842436741689504051)], [uint256(14775986697241998036361336069875532314889416931155074123055047444133147289485), uint256(7710569105028722235140817940879395220311153136498376379324017083126058038584)]);
        vk.IC[0] = Pairing.G1Point(uint256(7527448446822633881006353707476441802473155195337920176002639371616051876310), uint256(16090178411609243205945249838277936183154752783263782754890295557078303008742));
        vk.IC[1] = Pairing.G1Point(uint256(1483660204145759066689105364889142852378887056649467825565854245277728990091), uint256(17699940123291102574042810053772720396445030403776292850299296347600166706137));
        vk.IC[2] = Pairing.G1Point(uint256(5342846082419376373994466268921731472096616366119886605553308996945852485033), uint256(8205900749307517433811652766273696638633443682726253107477121806632252389600));
        vk.IC[3] = Pairing.G1Point(uint256(20147757608706538505801715302295944474887326029708300364266606685362846331931), uint256(17099615898411516079912033935761326554233729393362668445867495674077124447580));
        vk.IC[4] = Pairing.G1Point(uint256(3153588507625282016043641550064126711491194246207082637322062663611293234501), uint256(15070826965052566015406543410701714030015584363346516828568290969046574739462));
        vk.IC[5] = Pairing.G1Point(uint256(6258025095766337178815554018844185794859833085619799760446640254440331079351), uint256(20554520564509628557524241017970163965204843667100841561196959113207738810159));
        vk.IC[6] = Pairing.G1Point(uint256(8778828242319755663615102735137518889855537107242704996009188068317335577189), uint256(8063146526821170984013194268119119545136211989514966324451629476217833100571));

    }

    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        bytes memory proof,
        uint256[6] memory input
    ) public view returns (bool) {
        uint256[8] memory p = abi.decode(proof, (uint256[8]));
        for (uint8 i = 0; i < p.length; i++) {
            // Make sure that each element in the proof is less than the prime q
            require(p[i] < PRIME_Q, "verifier-proof-element-gte-prime-q");
        }
        Pairing.G1Point memory proofA = Pairing.G1Point(p[0], p[1]);
        Pairing.G2Point memory proofB = Pairing.G2Point([p[2], p[3]], [p[4], p[5]]);
        Pairing.G1Point memory proofC = Pairing.G1Point(p[6], p[7]);

        VerifyingKey memory vk = verifyingKey();
        // Compute the linear combination vkX
        Pairing.G1Point memory vkX = vk.IC[0];
        for (uint256 i = 0; i < input.length; i++) {
            // Make sure that every input is less than the snark scalar field
            require(input[i] < SNARK_SCALAR_FIELD, "verifier-input-gte-snark-scalar-field");
            vkX = Pairing.plus(vkX, Pairing.scalarMul(vk.IC[i + 1], input[i]));
        }

        return Pairing.pairing(
            Pairing.negate(proofA),
            proofB,
            vk.alfa1,
            vk.beta2,
            vkX,
            vk.gamma2,
            proofC,
            vk.delta2
        );
    }
}


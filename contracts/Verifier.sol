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
        vk.alfa1 = Pairing.G1Point(uint256(12811497812724166582581618007916337185194649121312342884555884485615181492145), uint256(11064503206956322351360935307576704734051407448978820407031808395451939802846));
        vk.beta2 = Pairing.G2Point([uint256(18595431529927174296570989091713217861078509305863339326376893185267915914247), uint256(20468572827655460233549767435746967448669363654223528846832691962857888636641)], [uint256(21812057999928842709618865136838536422472585397670208585849872306800022498572), uint256(8762477271332357604359857682339456760280270217116583471418752609172879142988)]);
        vk.gamma2 = Pairing.G2Point([uint256(12882482236280732349170222806431581045759317963838430709240060709506012613834), uint256(21565262186660521105092749538471064237085094736591638285548382013967837347061)], [uint256(7989289161582154328888367202000821552572207188997597777523670032898706522262), uint256(15853617445856681734149714041872140369853183379115824794291868138766196043584)]);
        vk.delta2 = Pairing.G2Point([uint256(47436903324387237912622031425333899045523324346104671433309963873093179354), uint256(10656359768614937870126024799937589824915061740338087064420081939036868034004)], [uint256(16270465993163987601561279022649212612020097546260726406202422396131688495245), uint256(8771488626298157756145758645817357570853772337387238199643828933557651008179)]);
        vk.IC[0] = Pairing.G1Point(uint256(121248274256815419794930307137223882614908942612231668602702998862145306011), uint256(20236598668826968800055030718546366591808728457081008320907049298889476372366));
        vk.IC[1] = Pairing.G1Point(uint256(10264575817284256775425190262537679175526605957856514989531445643213162655658), uint256(20819445470214554434157337970539520601759252237317841543461613189965246828083));
        vk.IC[2] = Pairing.G1Point(uint256(4702464815405184072166477423305420787356640015178193468645107870969440466532), uint256(11617274604393639152910667752692664183844535926073665875510072958152817318676));
        vk.IC[3] = Pairing.G1Point(uint256(8033956934973285382609328028113109691514494297743185435179867110638607195819), uint256(14962704426754706888895283622764323677805248425246575617868036956787293085176));
        vk.IC[4] = Pairing.G1Point(uint256(16390382225978459206382664357127941191182621228017075388566111247473825511229), uint256(5477352488174817578617642650234289419543691199887473418486700434378055565148));
        vk.IC[5] = Pairing.G1Point(uint256(11266913328186337885900156909253413912636244002908863719507916482607327512466), uint256(15082372985043969214858694211914255774298317332291970775801337905810575733643));
        vk.IC[6] = Pairing.G1Point(uint256(10039878567351244334021557456090061630695230621698775685977947799230872450649), uint256(9986196880708899890551448285262779473831072389346062628473288172435378942675));

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

